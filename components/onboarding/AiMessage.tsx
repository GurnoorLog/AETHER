"use client";

import { useState } from "react";
import TypingText from "./TypingText";

interface AiMessageProps {
  text: string;
  typingSpeed?: number;
  startDelay?: number;
  onTypingComplete?: () => void;
  showAvatar?: boolean;
}

export default function AiMessage({
  text,
  typingSpeed = 28,
  startDelay = 0,
  onTypingComplete,
  showAvatar = true,
}: AiMessageProps) {
  const [done, setDone] = useState(false);

  return (
    <div className="flex items-start gap-5" style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.24, 1)" }}>
      {showAvatar && (
        <div className={`w-14 h-14 rounded-2xl bg-sage flex items-center justify-center shrink-0 shadow-lg  ring-1 ring-sage/20 ${done ? 'avatar-breathing' : 'avatar-speaking'}`}>
          <div className="relative">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {!done && (
              <div className="absolute -bottom-1 -right-1 flex items-end gap-[1.5px] h-3">
                <div className="w-[2px] bg-white/80 rounded-full waveform-mini" style={{ animationDelay: "0s" }} />
                <div className="w-[2px] bg-white/80 rounded-full waveform-mini" style={{ animationDelay: "0.2s" }} />
                <div className="w-[2px] bg-white/80 rounded-full waveform-mini" style={{ animationDelay: "0.4s" }} />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 pt-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-black text-sage">Aether</span>
          {done && (
            <span className="text-[10px] font-bold text-warm-ink-faint uppercase tracking-widest">Just now</span>
          )}
        </div>
        <p className="text-lg md:text-xl text-warm-ink font-medium leading-relaxed">
          <TypingText
            text={text}
            speed={typingSpeed}
            startDelay={startDelay}
            onComplete={() => {
              setDone(true);
              onTypingComplete?.();
            }}
          />
        </p>
      </div>
    </div>
  );
}
