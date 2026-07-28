"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useVoiceTutor({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<
    "idle" | "connecting" | "connected" | "disconnected"
  >("idle");
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [outputMuted, setOutputMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationIdRef = useRef<string>("");
  const turnIdRef = useRef(0);
  const processingRef = useRef(false);
  const micActiveRef = useRef(false);
  const outputMutedRef = useRef(false);
  const stateRef = useRef(state);
  const convRef = useRef<Turn[]>([]);

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

  const speakText = useCallback((text: string) => {
    if (outputMutedRef.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const cleanup = useCallback(() => {
    if (sourceRef.current) sourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (wsRef.current) wsRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    window.speechSynthesis.cancel();
    wsRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    micActiveRef.current = false;
    processingRef.current = false;
  }, []);

  const start = useCallback(
    async (conversationId: string) => {
      if (stateRef.current !== "idle" && stateRef.current !== "disconnected") return;

      conversationIdRef.current = conversationId;
      setState("connecting");

      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.error("Missing NEXT_PUBLIC_DEEPGRAM_API_KEY");
        setState("disconnected");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        streamRef.current = stream;

        const audioContext = new AudioContext({ sampleRate: 16000 });
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        const ws = new WebSocket(
          `wss://api.deepgram.com/v1/listen?access_token=${apiKey}&encoding=linear16&sample_rate=${audioContext.sampleRate}&channels=1&interim_results=false&endpointing=200&model=nova-2-general`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          source.connect(processor);
          processor.connect(audioContext.destination);

          processor.onaudioprocess = (event) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            if (!micActiveRef.current || processingRef.current) return;
            const input = event.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              const s = Math.max(-1, Math.min(1, input[i]));
              pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            ws.send(pcm.buffer);
          };

          setState("connected");
          setMicActive(true);
          micActiveRef.current = true;
        };

        ws.onmessage = async (event) => {
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(event.data as string);
          } catch {
            return;
          }

          if (
            data.type === "Results" &&
            data.is_final === true &&
            data.channel
          ) {
            const alt = (data.channel as Record<string, unknown>)
              .alternatives as Array<{ transcript: string }> | undefined;
            const transcript = alt?.[0]?.transcript?.trim();
            if (!transcript || processingRef.current) return;

            processingRef.current = true;
            micActiveRef.current = false;

            addTurn("user", transcript);

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
                      if (parsed.type === "chunk" && parsed.text) {
                        fullResponse += parsed.text;
                        speakText(parsed.text);
                      }
                    } catch {}
                  }
                }
              }

              if (fullResponse) {
                addTurn("assistant", fullResponse);
              }
            } catch (err) {
              console.error("Chat API error:", err);
            } finally {
              processingRef.current = false;
              if (stateRef.current === "connected") {
                micActiveRef.current = true;
                setMicActive(true);
              }
            }
          }
        };

        ws.onclose = () => {
          cleanup();
          setMicActive(false);
          setState("disconnected");
        };
      } catch (err) {
        console.error("Failed to start voice session:", err);
        cleanup();
        setMicActive(false);
        setState("disconnected");
      }
    },
    [sessionId, addTurn, speakText, cleanup]
  );

  const stop = useCallback(() => {
    cleanup();
    setMicActive(false);
    setState("disconnected");
  }, [cleanup]);

  const setMicMuted = useCallback((muted: boolean) => {
    micActiveRef.current = !muted;
    setMicActive(!muted);
  }, []);

  const setOutputMutedFn = useCallback(
    (muted: boolean) => {
      outputMutedRef.current = muted;
      setOutputMuted(muted);
      if (muted) window.speechSynthesis.cancel();
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
