import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function verifyTotp(secret: string, token: string): boolean {
  const code = String(token).replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;

  const k = b32decode(secret);
  if (!k) return false;

  for (let off = -1; off <= 1; off++) {
    const ctr = Math.floor(Date.now() / 1000 / 30) + off;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(ctr));
    const mac = createHmac("sha1", k).update(buf).digest();
    const o = mac[mac.length - 1] & 0x0f;
    const n = (mac.readUInt32BE(o) & 0x7fffffff) % 1000000;
    const guess = String(n).padStart(6, "0");
    if (guess === code) return true;
  }
  return false;
}

export function totpIssuerUri(secret: string, account: string): string {
  return `otpauth://totp/Aether%20Admin:${encodeURIComponent(account)}?secret=${secret}&issuer=Aether%20Admin&algorithm=SHA1&digits=6&period=30`;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function b32decode(input: string): Buffer | null {
  const cl = input.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let b = 0;
  let val = 0;
  const bytes: number[] = [];
  for (const ch of cl) {
    const idx = B32.indexOf(ch);
    if (idx === -1) return null;
    val = (val << 5) | idx;
    b += 5;
    if (b >= 8) {
      bytes.push((val >>> (b - 8)) & 0xff);
      b -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hmacHash(v: string): Buffer {
  return createHmac("sha256", process.env.ADMIN_TOKEN_SECRET || "").update(v).digest();
}

export function signAdminToken(userId: string, email: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(`${userId}|${email}|${exp}`, "utf8").toString("base64url");
  const sig = hmacHash(payload).toString("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { userId: string; email: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expHash = hmacHash(payload);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== expHash.length || !timingSafeEqual(got, expHash)) return null;
  const plain = Buffer.from(payload, "base64url").toString("utf8");
  const [userId, email, exp] = plain.split("|");
  if (!userId || !email || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return { userId, email };
}

export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function logAudit(email: string | undefined, action: string, request: Request): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("admin_audit").insert({
      email: email ?? "unknown",
      action,
      ip: clientIp(request),
      user_agent: request.headers.get("user-agent") || null,
    });
  } catch (err) {
    console.error("Failed to log admin audit:", err);
  }
}

export async function isLockedOut(email: string | undefined, ip: string): Promise<{ locked: boolean; retryAfterSec: number }> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const db = createAdminClient();
  const { count } = await db
    .from("admin_audit")
    .select("id", { count: "exact", head: true })
    .eq("action", "verify_failed")
    .or(`email.eq.${email ?? "unknown"},ip.eq.${ip}`)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    const nxt = new Date(Date.now() + LOCKOUT_WINDOW_MS);
    return { locked: true, retryAfterSec: Math.ceil((nxt.getTime() - Date.now()) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}
