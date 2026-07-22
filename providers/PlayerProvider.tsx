"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import type { GeneratedTrack } from "@/types/database";

interface PlayerContextValue {
  currentTrack: GeneratedTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (track: GeneratedTrack) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: () => {},
  togglePlay: () => {},
  seek: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((track: GeneratedTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audio_url;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, currentTime, duration, play, togglePlay, seek }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
