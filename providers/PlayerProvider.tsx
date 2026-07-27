"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import type { GeneratedTrack } from "@/types/database";

interface PlayerContextValue {
  currentTrack: GeneratedTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: GeneratedTrack[];
  queueIndex: number;
  play: (track: GeneratedTrack, queueTracks?: GeneratedTrack[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  playAtIndex: (index: number) => void;
  setQueue: (tracks: GeneratedTrack[]) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,
  play: () => {},
  togglePlay: () => {},
  seek: () => {},
  nextTrack: () => {},
  prevTrack: () => {},
  playAtIndex: () => {},
  setQueue: () => {},
});

function loadState(): { track: GeneratedTrack | null; queue: GeneratedTrack[]; queueIndex: number } {
  if (typeof window === "undefined") return { track: null, queue: [], queueIndex: -1 };
  try {
    const raw = localStorage.getItem("aether-player");
    if (!raw) return { track: null, queue: [], queueIndex: -1 };
    return JSON.parse(raw);
  } catch {
    return { track: null, queue: [], queueIndex: -1 };
  }
}

function saveState(track: GeneratedTrack | null, queue: GeneratedTrack[], queueIndex: number) {
  try {
    localStorage.setItem("aether-player", JSON.stringify({ track, queue, queueIndex }));
  } catch {}
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saved = useRef(loadState());

  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(saved.current.track);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<GeneratedTrack[]>(saved.current.queue);
  const [queueIndex, setQueueIndex] = useState(saved.current.queueIndex);

  useEffect(() => {
    saveState(currentTrack, queue, queueIndex);
  }, [currentTrack, queue, queueIndex]);

  const play = useCallback((track: GeneratedTrack, queueTracks?: GeneratedTrack[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = track.audio_url;
    audio.load();
    audio.play().catch(() => {});

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);

    if (queueTracks && queueTracks.length > 0) {
      setQueueState(queueTracks);
      const idx = queueTracks.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setQueueState((prev) => {
        if (prev.length === 0) return [track];
        const idx = prev.findIndex((t) => t.id === track.id);
        if (idx >= 0) {
          setQueueIndex(idx);
          return prev;
        }
        setQueueIndex(prev.length);
        return [...prev, track];
      });
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playAtIndex = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    const track = queue[index];
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = track.audio_url;
    audio.load();
    audio.play().catch(() => {});

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setQueueIndex(index);
  }, [queue]);

  const nextTrack = useCallback(() => {
    const next = queueIndex + 1;
    if (next < queue.length) {
      const track = queue[next];
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.src = track.audio_url;
      audio.load();
      audio.play().catch(() => {});
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
      setQueueIndex(next);
    }
  }, [queueIndex, queue]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prev = queueIndex - 1;
    if (prev >= 0) {
      const track = queue[prev];
      if (!audio) return;
      audio.pause();
      audio.src = track.audio_url;
      audio.load();
      audio.play().catch(() => {});
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
      setQueueIndex(prev);
    }
  }, [queueIndex, queue]);

  const setQueue = useCallback((tracks: GeneratedTrack[]) => {
    setQueueState(tracks);
  }, []);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, currentTime, duration, queue, queueIndex, play, togglePlay, seek, nextTrack, prevTrack, playAtIndex, setQueue }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          const next = queueIndex + 1;
          if (next < queue.length) {
            const track = queue[next];
            if (audioRef.current) {
              audioRef.current.src = track.audio_url;
              audioRef.current.load();
              audioRef.current.play().catch(() => {});
              setCurrentTrack(track);
              setIsPlaying(true);
              setCurrentTime(0);
              setDuration(0);
              setQueueIndex(next);
            }
          } else {
            setIsPlaying(false);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
