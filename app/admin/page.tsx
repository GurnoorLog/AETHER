"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { isPublicAdminEmail } from "@/lib/admin";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  beta_approved: boolean;
  usage: {
    chat_count: number;
    quiz_count: number;
    voice_count: number;
    challenge_count: number;
    tokens_used: number;
  };
}

interface AuditRow {
  email: string;
  action: string;
  ip: string;
  created_at: string;
}

interface AdminData {
  users: UserRow[];
  audit: AuditRow[];
  stats: {
    total_users: number;
    total_tokens: number;
    total_chats: number;
    total_quizzes: number;
    total_voice: number;
    total_challenges: number;
    total_approved: number;
  };
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 editorial">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  verify_success: "2FA login",
  verify_failed: "Failed 2FA",
  token_rejected: "Rejected token",
  data_access: "Viewed portal",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const isAdmin = isPublicAdminEmail(user?.email);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    if (!authLoading && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      const stored = sessionStorage.getItem("aether_admin_token");
      if (stored) loadData(stored);
    }
  }, [user, isAdmin]);

  async function loadData(adminToken: string) {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { "x-admin-token": adminToken } });
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem("aether_admin_token");
        setData(null);
        setError("Session expired. Enter your code again.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load admin data");
      setData(await res.json());
      setError("");
    } catch {
      setError("Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const { token } = await res.json();
        sessionStorage.setItem("aether_admin_token", token);
        setCode("");
        loadData(token);
      } else if (res.status === 429) {
        const body = await res.json();
        setError(body.error || "Too many attempts. Try again later.");
      } else {
        setError("Incorrect code. Try again.");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  if (authLoading) {
    return <div className="h-screen bg-ink-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-ink-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ochre mb-2">Aether Admin</p>
            <h1 className="text-3xl font-bold tracking-tighter">Admin Portal</h1>
            <p className="text-sm text-white/40 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-full border border-white/10 text-xs font-bold hover:bg-white/5 transition-all cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {!data ? (
          <div className="max-w-md mx-auto mt-16 glass-card rounded-[28px] p-8 editorial">
            <h2 className="text-xl font-bold mb-1">Two-Factor Authentication</h2>
            <p className="text-sm text-white/40 mb-6">Enter the 6-digit code from Google Authenticator. Sessions expire after 6 hours.</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 2FA code"
                className="editorial-input w-full px-4 py-3 text-center"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={verifying || !code}
                className="w-full py-3 rounded-full bg-ochre text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
              >
                {verifying ? "Verifying..." : loadingData ? "Loading..." : "Unlock"}
              </button>
            </form>
            <p className="text-xs text-white/40 text-center mt-4">
              First time?{" "}
              <button onClick={() => router.push("/admin/setup")} className="underline text-ochre cursor-pointer">
                Set up Google Authenticator
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={String(data.stats.total_users)} />
              <StatCard label="Tokens Used" value={data.stats.total_tokens.toLocaleString()} accent="text-ochre" />
              <StatCard label="Messages Sent" value={String(data.stats.total_chats)} />
              <StatCard label="Beta Approved" value={`${data.stats.total_approved} / ${data.stats.total_users}`} />
            </div>

            <div className="glass-card rounded-[28px] overflow-hidden editorial">
              <div className="px-6 py-4 border-b border-hairline-warm flex items-center justify-between">
                <h3 className="font-bold">All Users</h3>
                <span className="text-xs text-white/40">{data.users.length} users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-hairline-warm">
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3 text-center">Chats</th>
                      <th className="px-6 py-3 text-center">Quizzes</th>
                      <th className="px-6 py-3 text-center">Voice</th>
                      <th className="px-6 py-3 text-center">Challenges</th>
                      <th className="px-6 py-3 text-right">Tokens</th>
                      <th className="px-6 py-3 text-center">Beta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id} className="border-b border-hairline-warm hover:bg-warm-ink/[0.04] transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-semibold">{u.full_name || "—"}</p>
                          <p className="text-xs text-white/40">{u.email || "no email"}</p>
                        </td>
                        <td className="px-6 py-3 text-white/50">{timeAgo(u.created_at)}</td>
                        <td className="px-6 py-3 text-center">{u.usage.chat_count}</td>
                        <td className="px-6 py-3 text-center">{u.usage.quiz_count}</td>
                        <td className="px-6 py-3 text-center">{u.usage.voice_count}</td>
                        <td className="px-6 py-3 text-center">{u.usage.challenge_count}</td>
                        <td className="px-6 py-3 text-right font-semibold text-ochre">
                          {u.usage.tokens_used.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.beta_approved ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/40"}`}>
                            {u.beta_approved ? "APPROVED" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.users.length === 0 && (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-white/40">No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card rounded-[28px] overflow-hidden editorial">
              <div className="px-6 py-4 border-b border-hairline-warm flex items-center justify-between">
                <h3 className="font-bold">Access Log</h3>
                <span className="text-xs text-white/40">last {data.audit.length} events</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-hairline-warm">
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">IP</th>
                      <th className="px-6 py-3">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.audit.map((a, i) => (
                      <tr key={i} className="border-b border-hairline-warm">
                        <td className="px-6 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${a.action === "verify_failed" || a.action === "token_rejected" ? "bg-red-500/10 text-red-400" : "bg-ochre/10 text-ochre"}`}>
                            {ACTION_LABELS[a.action] || a.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-white/70">{a.email}</td>
                        <td className="px-6 py-3 text-white/50 font-mono">{a.ip}</td>
                        <td className="px-6 py-3 text-white/50">{timeAgo(a.created_at)}</td>
                      </tr>
                    ))}
                    {data.audit.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No access events yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
