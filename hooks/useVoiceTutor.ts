"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SRAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SRResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SRAlternative;
}
interface SRResultList {
  readonly length: number;
  [index: number]: SRResult;
}
interface SREvent {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SRErrorEvent {
  readonly error: string;
  readonly message: string;
}
interface SRInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SREvent) => void) | null;
  onerror: ((event: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
declare var SpeechRecognition: { new (): SRInstance; prototype: SRInstance };
declare var webkitSpeechRecognition: { new (): SRInstance; prototype: SRInstance };

export function useVoiceTutor({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<
    "idle" | "connecting" | "connected" | "disconnected"
  >("idle");
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [outputMuted, setOutputMuted] = useState(false);

  const recognitionRef = useRef<SRInstance | null>(null);
  const conversationIdRef = useRef<string>("");
  const turnIdRef = useRef(0);
  const processingRef = useRef(false);
  const micActiveRef = useRef(false);
  const outputMutedRef = useRef(false);
  const stateRef = useRef(state);
  const convRef = useRef<Turn[]>([]);
  const restartRecognitionRef = useRef(false);

  stateRef.current = state;

  const addTurn = useCallback(
    (role: "user" | "assistant", content: string) => {
      const id = String(++turnIdRef.current);
      const turn: Turn = { id, role, content };
      convRef.current = [...convRef.current, turn];
      setConversation(convRef.current);
      return id;
    },
    []
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakText = useCallback(async (text: string) => {
    if (outputMutedRef.current || !text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; };
      audio.play().catch(() => { URL.revokeObjectURL(url); audioRef.current = null; });
    } catch (err) {
      console.error("Deepgram TTS error:", err);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      restartRecognitionRef.current = false;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    const SRImpl = SpeechRecognition || webkitSpeechRecognition;
    if (!SRImpl) {
      console.error("SpeechRecognition not supported in this browser");
      setState("disconnected");
      return;
    }

    restartRecognitionRef.current = true;
    const recognition = new SRImpl();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SREvent) => {
      if (processingRef.current) return;

      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.trim();
      if (!transcript) return;

      try { recognition.stop(); } catch {}

      processingRef.current = true;
      micActiveRef.current = false;
      setMicActive(false);

      addTurn("user", transcript);

      (async () => {
        try {
          const chatRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: transcript,
              conversation_id: conversationIdRef.current,
              session_id: sessionId,
            }),
          });

          if (!chatRes.ok) throw new Error(`Chat API error: ${chatRes.status}`);

          const reader = chatRes.body?.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let fullResponse = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });

              const lines = buf.split("\n");
              buf = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.type === "error" && parsed.text) {
                    speakText(parsed.text);
                  } else if (parsed.type === "chunk" && parsed.text) {
                    fullResponse += parsed.text;
                  }
                } catch {}
              }
            }
          }

          if (fullResponse) {
            addTurn("assistant", fullResponse);
            speakText(fullResponse);
          }
        } catch (err) {
          console.error("Chat API error:", err);
        } finally {
          processingRef.current = false;
          if (stateRef.current === "connected") {
            micActiveRef.current = true;
            setMicActive(true);
            if (restartRecognitionRef.current) {
              try { recognition.start(); } catch {}
            }
          }
        }
      })();
    };

    recognition.onerror = (event: SRErrorEvent) => {
      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;
      console.error("SpeechRecognition error:", event.error);
    };

    recognition.onend = () => {
      if (
        restartRecognitionRef.current &&
        stateRef.current === "connected" &&
        !processingRef.current
      ) {
        try { recognition.start(); } catch {}
      }
    };

    try { recognition.start(); } catch (err) {
      console.error("Failed to start SpeechRecognition:", err);
      setState("disconnected");
      return;
    }

    recognitionRef.current = recognition;
    setState("connected");
    setMicActive(true);
    micActiveRef.current = true;
  }, [sessionId, addTurn, speakText]);

  const start = useCallback(
    async (conversationId: string) => {
      if (stateRef.current !== "idle" && stateRef.current !== "disconnected") return;

      conversationIdRef.current = conversationId;
      setState("connecting");

      try {
        await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        startRecognition();
      } catch (err) {
        console.error("Microphone permission denied:", err);
        setState("disconnected");
      }
    },
    [startRecognition]
  );

  const stop = useCallback(() => {
    restartRecognitionRef.current = false;
    stopRecognition();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setMicActive(false);
    setState("disconnected");
  }, [stopRecognition]);

  const setMicMuted = useCallback((muted: boolean) => {
    if (muted) {
      restartRecognitionRef.current = false;
      stopRecognition();
      micActiveRef.current = false;
      setMicActive(false);
    } else {
      startRecognition();
      micActiveRef.current = true;
      setMicActive(true);
    }
  }, [startRecognition, stopRecognition]);

  const setOutputMutedFn = useCallback(
    (muted: boolean) => {
      outputMutedRef.current = muted;
      setOutputMuted(muted);
      if (muted && audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    },
    []
  );

  useEffect(() => {
    return () => {
      restartRecognitionRef.current = false;
      stopRecognition();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, [stopRecognition]);

  return {
    state,
    conversation,
    micActive,
    outputMuted,
    start,
    stop,
    setMicMuted,
    setOutputMuted: setOutputMutedFn,
  };
}
