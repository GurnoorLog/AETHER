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
    <div className="fixed inset-0 z-[300] bg-[#FBF7F0] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center max-w-md w-full px-8">
        <div className="w-24 h-24 rounded-full bg-[#3F5C3A] flex items-center justify-center mb-12 border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436]">
          <span className="serif-display text-white text-4xl sm:text-5xl font-semibold">A</span>
        </div>

        <p className="text-lg md:text-xl text-[#2D3436] font-medium text-center mb-10 min-h-[2em]">
           {txt}
          <span className="inline-block w-[3px] h-[1em] bg-[#3F5C3A] ml-0.5 align-middle rounded-full animate-pulse" />
        </p>

        <div className="w-full h-1.5 bg-[#E7E1D6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3F5C3A] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] font-bold text-[#A0A5A8] uppercase tracking-[0.2em] mt-6">
          Personalizing your experience
        </p>
      </div>
    </div>
  );
}