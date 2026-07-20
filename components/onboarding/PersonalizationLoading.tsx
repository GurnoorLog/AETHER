"use client";

import { useEffect, useState, useRef } from "react";

const messages = [
  "Creating your personal AI tutor...",
  "Learning your preferences...",
  "Building your private knowledge base...",
  "Preparing your dashboard...",
  "Personalizing your learning experience...",
];

export default function PersonalizationLoading({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const charIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 3 + 1;
        return next >= 100 ? 100 : next;
      });
    }, 200);
    intervalRef.current = progressInterval;

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (currentIndex >= messages.length) return;

    charIndexRef.current = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (charIndexRef.current < messages[currentIndex].length) {
        setDisplayedText(messages[currentIndex].slice(0, charIndexRef.current + 1));
        charIndexRef.current++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (currentIndex < messages.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setDisplayedText(messages[currentIndex]);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(onComplete, 800);
          }
        }, 600);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [currentIndex, onComplete]);

  return (
    <div className="fixed inset-0 z-[300] bg-deep-onyx flex flex-col items-center justify-center">
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyber-yellow/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particleFloat ${6 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
        {/* Animated AI icon */}
        <div className="w-24 h-24 rounded-[32px] bg-cyber-yellow/10 flex items-center justify-center mb-12 ring-1 ring-cyber-yellow/20 shadow-[0_0_60px_rgba(253,224,71,0.1)]">
          <div className="relative">
            <svg className="w-12 h-12 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        {/* Typing message */}
        <p className="text-lg md:text-xl text-white/80 font-medium text-center mb-10 min-h-[2em]">
          {displayedText}
          <span className="inline-block w-[3px] h-[1em] bg-cyber-yellow ml-0.5 align-middle animate-pulse" />
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber-yellow to-cyan-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-6">
          Personalizing{currentIndex > 0 ? ` ${Math.round((currentIndex / messages.length) * 100)}%` : ""}
        </p>
      </div>
    </div>
  );
}
