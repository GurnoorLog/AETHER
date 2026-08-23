"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DesmosGraph from "@/components/DesmosGraph";

interface MathChallenge {
  type: "math";
  id: string;
  title: string;
  description: string;
  difficulty: string;
  latex: string;
  answer: string;
  hint?: string;
}

function loadChallenge(sid: string, cid: string): MathChallenge | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(sessionStorage.getItem(`aether_challenges_${sid}`) || "[]") as MathChallenge[];
    return all.find((c) => c.id === cid && c.type === "math") || null;
  } catch {
    return null;
  }
}

export default function MathChallengePage() {
  const params = useParams();
  const router = useRouter();
  const sid = (params.session as string) || "";
  const cid = (params.id as string) || "";

  const [challenge, setChallenge] = useState<MathChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const c = loadChallenge(sid, decodeURIComponent(cid));
    if (c) setChallenge(c);
  }, [sid, cid]);

  const checkAnswer = () => {
    if (!challenge) return;
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    setResult(normalize(userAnswer) === normalize(challenge.answer) ? "correct" : "wrong");
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] text-warm-ink flex items-center justify-center">
        <p className="text-sm text-warm-ink-faint">Loading challenge...</p>
      </div>
    );
  }

  const diffColor =
    challenge.difficulty === "easy"
      ? "text-green-400 bg-green-400/10"
      : challenge.difficulty === "medium"
        ? "text-sage bg-sage/10"
        : "text-red-400 bg-red-400/10";

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-warm-ink flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-hairline-warm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${sid}/challenges`)}
            className="w-8 h-8 rounded-lg hover:bg-warm-ink/[0.05] flex items-center justify-center cursor-pointer"
            title="Back to challenges"
          >
            <svg className="w-4 h-4 text-warm-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-bold">{challenge.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${diffColor}`}>
                {challenge.difficulty}
              </span>
              <span className="text-[9px] font-bold uppercase text-warm-ink-faint px-1.5 py-0.5 rounded-full bg-warm-ink/[0.04]">Math</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Description */}
          <div className="glass-card-warm rounded-3xl p-5">
            <p className="text-sm text-warm-ink-soft leading-relaxed">{challenge.description}</p>
            {challenge.latex && (
              <div className="mt-4 p-4 bg-black/40 rounded-2xl text-center">
                <code className="text-lg text-sage/90 font-mono">{challenge.latex}</code>
              </div>
            )}
          </div>

          {/* Desmos */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-warm-ink-faint mb-2">Graphing Calculator</h3>
            <DesmosGraph expressions={challenge.latex ? [challenge.latex] : []} />
          </div>

          {/* Answer */}
          <div className="glass-card-warm rounded-3xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-warm-ink-faint mb-3">Your Answer</h3>
            <div className="flex items-center gap-3">
              <input
                value={userAnswer}
                onChange={(e) => { setUserAnswer(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                placeholder="Enter your answer (e.g. 2x + 3)..."
                className="flex-1 bg-warm-ink/[0.03] border border-hairline-warm rounded-full px-4 py-2.5 text-sm text-warm-ink placeholder-warm-ink-faint outline-none focus:border-sage/50 font-mono"
              />
              <button
                onClick={checkAnswer}
                className="shrink-0 bg-sage text-white px-6 py-2.5 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Check
              </button>
            </div>
            {result === "correct" && (
              <p className="mt-3 text-xs font-bold text-green-400">Correct!</p>
            )}
            {result === "wrong" && (
              <div>
                <p className="mt-3 text-xs font-bold text-red-400">Not quite. Try again!</p>
                {challenge.hint && (
                  <p className="mt-1 text-xs text-warm-ink-muted">Hint: {challenge.hint}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
