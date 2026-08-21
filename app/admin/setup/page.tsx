"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { isPublicAdminEmail } from "@/lib/admin";

export default function AdminSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [totp, setTotp] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const isAdmin = isPublicAdminEmail(user?.email);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetch("/api/admin/setup")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setTotp(d));
    }
  }, [user, isAdmin]);

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
        router.push("/admin");
      } else {
        setError("Code not accepted. Scan it in Google Authenticator first, then try again.");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  if (authLoading || !totp) {
    return <div className="h-screen bg-deep-onyx text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-deep-onyx text-white">
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="glass-card rounded-[28px] p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow mb-2">Aether Admin</p>
          <h1 className="text-2xl font-bold tracking-tighter mb-2">Set up Google Authenticator</h1>
          <p className="text-sm text-white/40 mb-6">
            In the Google Authenticator app, tap <b className="text-white/80">+</b> →{" "}
            <b className="text-white/80">Enter a setup key</b>, and paste the key below:
          </p>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Setup key</p>
            <code className="text-cyber-yellow font-mono text-sm break-all">{totp.secret}</code>
          </div>

          <p className="text-sm text-white/40 mb-6">
            Or scan this URI directly: <code className="text-xs text-white/60 break-all">{totp.uri}</code>
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the 6-digit code to confirm"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-center focus:outline-none focus:border-cyber-yellow/50"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full py-3 rounded-full bg-cyber-yellow text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
            >
              {verifying ? "Verifying..." : "Confirm & Unlock"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}