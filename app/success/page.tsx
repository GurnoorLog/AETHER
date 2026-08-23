"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-warm-ink mb-4 tracking-tight">You&apos;re In!</h1>
        <p className="text-warm-ink-muted text-sm font-bold mb-8">
          Your subscription is active. Redirecting to your dashboard in a few seconds...
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-10 py-4 bg-sage text-white rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sage/10 cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
