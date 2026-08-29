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

function grabChallenge(sid: string, cid: string): MathChallenge | null {
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
  const [ans, setAns] = useState("");
  const [out, setOut] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const c = grabChallenge(sid, decodeURIComponent(cid));
    if (c) setChallenge(c);
  }, [sid, cid]);

  const check = () => {
    if (!challenge) return;
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    setOut(normalize(ans) === normalize(challenge.answer) ? "correct" : "wrong");
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] text-warm-ink flex items-center justify-center">
        <p className="text-sm text-warm-ink-faint">Loading challenge...</p>
      </div>
    );
  }

  let diffColor = "text-red-400 bg-red-400/10";
  if (challenge.difficulty === "easy") diffColor = "text-green-400 bg-green-400/10";
  else if (challenge.difficulty === "medium") diffColor = "text-sage bg-sage/10";

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-warm-ink flex flex-col">
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-3xl p-5 editorial">
            <p className="text-sm text-warm-ink-soft leading-relaxed">{challenge.description}</p>
            {challenge.latex && (
              <div className="mt-4 p-4 bg-black/40 rounded-2xl text-center editorial">
                <code className="text-lg text-sage/90 font-mono">{challenge.latex}</code>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-warm-ink-faint mb-2">Graphing Calculator</h3>
            <DesmosGraph expressions={challenge.latex ? [challenge.latex] : []} />
          </div>
          <div className="bg-white rounded-3xl p-5 editorial">
            <h3 className="text-xs font-bold uppercase tracking-widest text-warm-ink-faint mb-3">Your Answer</h3>
            <div className="flex items-center gap-3">
              <input
                value={ans}
                onChange={(e) => { setAns(e.target.value); setOut(null); }}
                onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder="Enter your answer (e.g. 2x + 3)..."
                className="editorial-input flex-1 px-4 py-2.5 text-sm font-mono"
              />
              <button
                onClick={check}
                className="shrink-0 btn-editorial px-6 py-2.5 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Check
              </button>
            </div>
            {out === "correct" && (
              <p className="mt-3 text-xs font-bold text-green-400">Correct!</p>
            )}
            {out === "wrong" && (
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