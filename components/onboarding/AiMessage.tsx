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
        <div className="w-14 h-14 rounded-full bg-[#3F5C3A] flex items-center justify-center shrink-0 border-2 border-[#2D3436] shadow-[3px_3px_0_0_#2D3436]">
          <span className="serif-display text-white text-2xl font-semibold">A</span>
        </div>
      )}
      <div className="flex-1 pt-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-[#3F5C3A]">Aether</span>
          {done && (
            <span className="text-[10px] font-bold text-[#A0A5A8] uppercase tracking-[0.18em]">Just now</span>
          )}
        </div>
        <p className="text-lg md:text-xl text-[#2D3436] font-medium leading-relaxed">
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
