"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const completeOnboarding = async () => {
    setFinishing(true);

    try {
      const supabase = createClient();
      await supabase
        .from("user_profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user!.id);

      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-cyber-yellow animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  const steps = [
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
        </svg>
      ),
      title: "Welcome to Aether",
      description: "Your personal AI tutor that builds a private knowledge graph for everything you learn.",
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: "Upload & Learn",
      description: "Upload notes, slides, or textbooks. Aether instantly builds a connected knowledge map.",
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      ),
      title: "Voice Conversations",
      description: "Speak naturally with your AI tutor. Get real-time answers and explanations.",
    },
  ];

  return (
    <div className="min-h-screen bg-deep-onyx flex items-center justify-center px-8">
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-4 justify-center mb-20">
          <div className="w-12 h-12 rounded-2xl bg-cyber-yellow flex items-center justify-center">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tighter">AETHER</span>
        </div>

        <div className="space-y-6 mb-16">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`glass-card p-8 rounded-[32px] premium-transition cursor-pointer border-white/10 ${
                step === i
                  ? "border-cyber-yellow/40 shadow-[0_0_40px_rgba(253,224,71,0.05)]"
                  : "opacity-40 hover:opacity-70"
              }`}
              onClick={() => setStep(i)}
            >
              <div className="flex items-center gap-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    step === i ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/40"
                  }`}
                >
                  {s.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{s.title}</h3>
                  <p className="text-white/40 text-sm font-medium">{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 justify-center">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full premium-transition ${
                  step === i ? "bg-cyber-yellow w-6" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={completeOnboarding}
            disabled={finishing}
            className="px-10 py-5 bg-cyber-yellow text-black rounded-2xl font-black text-sm
              hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10
              disabled:opacity-50 cursor-pointer"
          >
            {finishing ? (
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting Ready...
              </span>
            ) : (
              "Get Started"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
