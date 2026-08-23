"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/app/[session]/layout";
import CodeCell from "@/components/CodeCell";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  starterCode: string;
  solution?: string;
  testCases?: { input: string; expected: string }[];
}

function loadChallenge(sid: string, cid: string): Challenge | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(sessionStorage.getItem(`aether_challenges_${sid}`) || "[]") as Challenge[];
    return all.find((c) => c.id === cid) || null;
  } catch {
    return null;
  }
}

export default function ChallengeCodePage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useSession();
  const sid = (params.session as string) || "";
  const cid = (params.id as string) || "";

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [cells, setCells] = useState<string[]>([""]);
  const [results, setResults] = useState<{ output: string; error?: string }[]>([]);

  useEffect(() => {
    const c = loadChallenge(sid, decodeURIComponent(cid));
    if (c) {
      setChallenge(c);
      // Pre-fill first cell with starter code
      if (c.starterCode && cells[0] === "") {
        setCells([c.starterCode]);
      }
    }
  }, [sid, cid]);

  const handleRun = useCallback(
    (idx: number, code: string, output: string, error?: string) => {
      setResults((prev) => {
        const next = [...prev];
        next[idx] = { output, error };
        return next;
      });
    },
    [],
  );

  const addCell = () => {
    setCells((prev) => [...prev, ""]);
    setResults((prev) => [...prev, { output: "" }]);
  };

  const updateCell = (idx: number, code: string) => {
    setCells((prev) => {
      const next = [...prev];
      next[idx] = code;
      return next;
    });
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
              <span className="text-[9px] font-bold uppercase text-warm-ink-faint px-1.5 py-0.5 rounded-full bg-warm-ink/[0.04]">
                {challenge.language}
              </span>
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
          </div>

          {/* Code cells */}
          <div className="space-y-4">
            {cells.map((code, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-warm-ink-faint">Cell {i + 1}</span>
                  {cells.length > 1 && (
                    <button
                      onClick={() => {
                        setCells((prev) => prev.filter((_, j) => j !== i));
                        setResults((prev) => prev.filter((_, j) => j !== i));
                      }}
                      className="text-[10px] text-red-400/60 hover:text-red-400 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <CodeCell
                  language={challenge.language}
                  defaultCode={code}
                  onRun={(c, o, e) => handleRun(i, c, o, e)}
                />
              </div>
            ))}
          </div>

          {/* Add cell */}
          <button
            onClick={addCell}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-hairline-warm text-xs font-bold text-warm-ink-faint hover:text-warm-ink-muted hover:border-hairline-warm transition-all cursor-pointer"
          >
            + Add Cell
          </button>

          {/* Test cases */}
          {challenge.testCases && challenge.testCases.length > 0 && (
            <div className="glass-card-warm rounded-3xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-warm-ink-faint mb-3">Test Cases</h3>
              <div className="space-y-2">
                {challenge.testCases.map((tc, i) => (
                  <div key={i} className="text-xs font-mono bg-black/40 rounded-xl px-4 py-2">
                    <span className="text-warm-ink-muted">Input: </span>
                    <span className="text-warm-ink-soft">{tc.input}</span>
                    <br />
                    <span className="text-warm-ink-muted">Expected: </span>
                    <span className="text-sage/80">{tc.expected}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
