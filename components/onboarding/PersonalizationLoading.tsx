"use client";

import { useEffect, useState, useRef } from "react";

const msgs = [
  "Creating your personal AI tutor...",
  "Learning your preferences...",
  "Building your private knowledge base...",
  "Preparing your dashboard...",
  "Personalizing your learning experience...",
];

export default function PersonalizationLoading({ onComplete }: { onComplete: () => void }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [txt, setTxt] = useState("");
  const ciRef = useRef(0);
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        let next = prev + Math.random() * 2.5 + 0.5;
        if (next >= 100) next = 100;
        return next;
      });
    }, 200);
    ivRef.current = progressInterval;

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (idx >= msgs.length) return;

    ciRef.current = 0;
    setTxt("");

    const interval = setInterval(() => {
      if (ciRef.current < msgs[idx].length) {
        setTxt(msgs[idx].slice(0, ciRef.current + 1));
        ciRef.current++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (idx < msgs.length - 1) {
            setIdx((prev) => prev + 1);
          } else {
            setTxt(msgs[idx]);
            if (ivRef.current) clearInterval(ivRef.current);
            setTimeout(onComplete, 800);
          }
        }, 600);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [idx, onComplete]);

  return (
    <div className="fixed inset-0 z-[300] bg-deep-onyx flex flex-col items-center justify-center editorial">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(253,224,71,0.06)_0%,_transparent_60%)] pointer-events-none editorial" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-yellow/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1.5 + Math.random() * 2.5}px`,
              height: `${1.5 + Math.random() * 2.5}px`,
              background: i % 3 === 0 ? 'rgba(253,224,71,0.25)' : i % 3 === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(6,182,212,0.15)',
              animation: `particleFloat ${7 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.2 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
        <div className="w-24 h-24 rounded-[32px] bg-cyber-yellow/10 flex items-center justify-center mb-12 ring-1 ring-cyber-yellow/20 shadow-[0_0_60px_rgba(253,224,71,0.1)] avatar-breathing editorial">
          <div className="relative">
            <svg className="w-12 h-12 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <p className="text-lg md:text-xl text-white/80 font-medium text-center mb-10 min-h-[2em]">
           {txt}
          <span className="typing-cursor inline-block w-[3px] h-[1em] bg-cyber-yellow ml-0.5 align-middle rounded-full" />
        </p>

        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyber-yellow via-amber-400 to-cyan-accent rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(253,224,71,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-6">
          Personalizing your experience
        </p>
      </div>
    </div>
  );
}
