"use client";

import { useEffect, useState, useRef } from "react";

const steps = [
  { icon: "🧠", text: "Creating your personal AI tutor..." },
  { icon: "📂", text: "Building your private knowledge base..." },
  { icon: "🎯", text: "Personalizing your learning experience..." },
  { icon: "📊", text: "Preparing your dashboard..." },
  { icon: "✨", text: "Almost ready..." },
];

export default function PersonalizationLoading({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 2.5 + 0.5;
        return next >= 100 ? 100 : next;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (currentIndex >= steps.length) return;

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      });
      setTimeout(() => {
        if (currentIndex < steps.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setTimeout(onComplete, 1200);
        }
      }, 500);
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentIndex, onComplete]);

  return (
    <div className="fixed inset-0 z-[300] bg-deep-onyx flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(253,224,71,0.06)_0%,_transparent_60%)] pointer-events-none" />
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
        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(253,224,71,0.1)] transition-all duration-700 ${
          currentIndex >= steps.length - 1 ? 'bg-cyber-yellow/20 ring-1 ring-cyber-yellow/30' : 'bg-cyber-yellow/10 ring-1 ring-cyber-yellow/20'
        }`}>
          <div className="relative">
            <svg className={`w-12 h-12 transition-all duration-700 ${
              currentIndex >= steps.length - 1 ? 'text-cyber-yellow' : 'text-cyber-yellow/80'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <div className="w-full mb-10 space-y-3">
          {steps.map((step, i) => {
            const isActive = i === currentIndex;
            const isDone = completedSteps.has(i);
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 ${
                  isDone
                    ? "bg-cyber-yellow/[0.06] ring-1 ring-cyber-yellow/10 opacity-100"
                    : isActive
                    ? "opacity-100"
                    : "opacity-20"
                }`}
              >
                <span className={`text-lg transition-all duration-500 ${isDone ? "" : "grayscale"}`}>
                  {isDone ? step.icon : (isActive ? "⏳" : "○")}
                </span>
                <span className={`text-sm font-medium transition-all duration-500 ${
                  isDone ? "text-white/80" : isActive ? "text-white/60" : "text-white/30"
                }`}>
                  {step.text}
                </span>
                {isDone && (
                  <svg className="w-4 h-4 text-cyber-yellow ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber-yellow via-amber-400 to-cyan-accent rounded-full transition-all duration-500 ease-out"
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
