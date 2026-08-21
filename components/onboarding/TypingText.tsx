"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  startDelay?: number;
}

export default function TypingText({ text, speed = 30, className, onComplete, startDelay = 0 }: TypingTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const delay = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delay);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    indexRef.current = 0;
    setDisplayed("");

    const type = () => {
      if (indexRef.current < text.length) {
        const chunk = text[indexRef.current];
        setDisplayed((prev) => prev + chunk);
        indexRef.current++;
        const variance = Math.random() * 24 - 8;
        timeoutRef.current = setTimeout(type, Math.max(12, speed + variance));
      } else {
        onCompleteRef.current?.();
      }
    };

    timeoutRef.current = setTimeout(type, 120);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, started]);

  if (!started) return null;

  return (
    <span className={className}>
      <span className="typing-char">{displayed}</span>
      <span className="inline-block w-[3px] h-[1.05em] bg-cyber-yellow ml-0.5 align-middle rounded-full typing-cursor" />
    </span>
  );
}
