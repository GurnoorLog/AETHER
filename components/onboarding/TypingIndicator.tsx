"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-5" style={{ animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.24, 1)" }}>
      <div className="w-14 h-14 rounded-2xl bg-cyber-yellow/20 flex items-center justify-center shrink-0 shadow-lg ring-1 ring-cyber-yellow/10 avatar-breathing">
        <svg className="w-7 h-7 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <div className="flex-1 pt-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-black text-cyber-yellow">Aether</span>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Typing...</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-yellow/60 typing-dot" style={{ animationDelay: "0s" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-yellow/60 typing-dot" style={{ animationDelay: "0.15s" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-yellow/60 typing-dot" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  );
}
