"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "../layout";
import { createClient } from "@/lib/supabase/client";

interface CodeChallenge {
  type: "code";
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  starterCode: string;
  solution?: string;
  testCases?: { input: string; expected: string }[];
}

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

type Challenge = CodeChallenge | MathChallenge;

const STORAGE_KEY = (sid: string) => `aether_challenges_${sid}`;

function getChals(sid: string): Challenge[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY(sid)) || "[]");
  } catch {
    return [];
  }
}

function putChals(sid: string, challenges: Challenge[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY(sid), JSON.stringify(challenges));
}

const looksMath = (s: string) => /math|algebra|calculus|geometry|trig|statistics|arithmetic|equation|derivative|integral/i.test(s);

export default function ChallengesHub() {
  const { session } = useSession();
  const params = useParams();
  const router = useRouter();
  const sid = (params.session as string) || "";
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [topic, setTopic] = useState("");
  const [challengeType, setChallengeType] = useState<"code" | "math">("code");
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const subject = session?.subject || "";
  const isMathSession = looksMath(subject);

  useEffect(() => {
    setChallengeType(isMathSession ? "math" : "code");
  }, [isMathSession]);

  useEffect(() => {
    if (!sid || loaded || !session?.id) return;
    const got = getChals(sid);
    if (got.length > 0) {
      setChallenges(got);
    } else {
      supabase
        .from("ai_memories")
        .select("content")
        .eq("session_id", session.id)
        .eq("context", "challenge")
        .order("created_at", { ascending: false })
          .then(({ data: out }) => {
          if (out && out.length > 0) {
            const list: Challenge[] = [];
            for (const d of out) {
              try {
                list.push(JSON.parse(d.content) as Challenge);
              } catch {}
            }
            setChallenges(list);
            putChals(sid, list);
          }
        });
    }
    setLoaded(true);
  }, [sid, loaded, session?.id]);

  const stash = async (c: Challenge) => {
    const updated = [...challenges, c];
    setChallenges(updated);
    putChals(sid, updated);
    try {
      const uid = session?.user_id || (await supabase.auth.getUser()).data.user?.id;
      await supabase.from("ai_memories").insert({
        user_id: uid,
        session_id: session?.id,
        context: "challenge",
        content: JSON.stringify(c),
      });
    } catch {}
  };

  const makeOne = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/challenges/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic: topic.trim(),
          type: challengeType,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await stash(data);
      setTopic("");
    } catch (err) {
      console.error("Failed to generate challenge:", err);
    } finally {
      setGenerating(false);
    }
  };

  const goTo = (c: Challenge) => {
    const page = c.type === "math" ? "challenge-math" : "challenge-code";
    router.push(`/${sid}/${page}/${encodeURIComponent(c.id)}`);
  };

  const colorFor = (d: string) =>
    d === "easy" ? "text-green-400" : d === "medium" ? "text-sage" : "text-red-400";

  const iconFor = (c: Challenge) =>
    c.type === "math"
      ? <path d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm2.25 0v3.75m3-3.75v3.75m-3 5.25c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm2.25 0v3.75m3-3.75v3.75m3.75-9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm2.25 0v3.75m3-3.75v3.75" />
      : <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />;

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-warm-ink p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push(`/${sid}/dashboard`)} className="w-8 h-8 rounded-lg hover:bg-warm-ink/[0.05] flex items-center justify-center cursor-pointer">
            <svg className="w-4 h-4 text-warm-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-black serif-display">Challenges</h1>
            <p className="text-xs text-warm-ink-muted">Practice with adaptive {isMathSession ? "math" : "coding"} challenges</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 mb-8 editorial">
          <h2 className="text-sm font-bold mb-3">Ask AI to create a challenge</h2>
          <div className="flex items-center gap-3 mb-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && makeOne()}
              placeholder={isMathSession ? 'e.g. "derivatives of trig functions", "integrals"...' : 'e.g. "for loops with lists", "recursive functions"...'}
              className="editorial-input flex-1 px-4 py-2 text-sm"
            />
            <button
              onClick={makeOne}
              disabled={generating || !topic.trim()}
              className="shrink-0 btn-editorial px-6 py-2 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          {!isMathSession && (
            <div className="flex gap-2">
              {(["code", "math"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChallengeType(t)}
                  className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full transition-all cursor-pointer ${challengeType === t ? "bg-sage/20 text-sage" : "text-warm-ink-faint hover:text-warm-ink-soft"}`}
                >
                  {t === "code" ? "Coding" : "Math"}
                </button>
              ))}
            </div>
          )}
        </div>
        {challenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-warm-ink/[0.04] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-warm-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <p className="text-sm text-warm-ink-faint">No challenges yet. Ask AI to generate one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c) => (
              <button
                key={c.id}
                 onClick={() => goTo(c)}
                className="w-full bg-white rounded-2xl p-5 flex items-start gap-4 hover:bg-warm-ink/[0.04] transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0 editorial">
                  <svg className="w-5 h-5 text-sage/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    {iconFor(c)}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold truncate">{c.title}</h3>
                    <span className={`text-[10px] font-bold uppercase ${colorFor(c.difficulty)}`}>{c.difficulty}</span>
                  </div>
                  <p className="text-xs text-warm-ink-muted line-clamp-2">{c.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-warm-ink-faint px-2 py-1 rounded-full bg-warm-ink/[0.04]">{c.type === "math" ? "Math" : (c as CodeChallenge).language}</span>
                  <svg className="w-4 h-4 text-warm-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}