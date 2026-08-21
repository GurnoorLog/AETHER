import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function verifyTotp(secret: string, token: string): boolean {
  const code = String(token).replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;

  const key = base32Decode(secret);
  if (!key) return false;

  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor(Date.now() / 1000 / 30) + offset;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac("sha1", key).update(buf).digest();
    const o = hmac[hmac.length - 1] & 0x0f;
    const num = (hmac.readUInt32BE(o) & 0x7fffffff) % 1000000;
    const candidate = String(num).padStart(6, "0");
    if (candidate === code) return true;
  }
  return false;
}

export function totpIssuerUri(secret: string, account: string): string {
  return `otpauth://totp/Aether%20Admin:${encodeURIComponent(account)}?secret=${secret}&issuer=Aether%20Admin&algorithm=SHA1&digits=6&period=30`;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer | null {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of cleaned) {
    const idx = B32.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function sha256(value: string): Buffer {
  return createHmac("sha256", process.env.ADMIN_TOKEN_SECRET || "").update(value).digest();
}

export function signAdminToken(userId: string, email: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(`${userId}|${email}|${exp}`, "utf8").toString("base64url");
  const sig = sha256(payload).toString("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { userId: string; email: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sha256(payload);
  const provided = Buffer.from(sig, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [userId, email, exp] = decoded.split("|");
  if (!userId || !email || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return { userId, email };
}

export function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function logAudit(email: string | undefined, action: string, request: Request): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit").insert({
      email: email ?? "unknown",
      action,
      ip: clientIp(request),
      user_agent: request.headers.get("user-agent") || null,
    });
  } catch (e) {
    console.error("Failed to log admin audit:", e);
  }
}

export async function isLockedOut(email: string | undefined, ip: string): Promise<{ locked: boolean; retryAfterSec: number }> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const admin = createAdminClient();
  const { count } = await admin
    .from("admin_audit")
    .select("id", { count: "exact", head: true })
    .eq("action", "verify_failed")
    .or(`email.eq.${email ?? "unknown"},ip.eq.${ip}`)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    const next = new Date(Date.now() + LOCKOUT_WINDOW_MS);
    return { locked: true, retryAfterSec: Math.ceil((next.getTime() - Date.now()) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}
