"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayer } from "@/providers/PlayerProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";
import type { GeneratedTrack, Playlist } from "@/types/database";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home", key: "home" },
  { href: "/chat", icon: "tutor", label: "AI Tutor", key: "tutor" },
  { href: "/knowledge", icon: "knowledge", label: "Knowledge", key: "knowledge" },
  { href: "/study", icon: "file-text", label: "Documents", key: "docs" },
  { href: "/quizzes", icon: "pencil-line", label: "Quizzes", key: "quizzes" },
  { href: "/progress", icon: "bar-chart-3", label: "Progress", key: "progress" },
  { href: "/roadmap", icon: "route", label: "Roadmap", key: "roadmap" },
  { href: "/music", icon: "music", label: "Focus Music", key: "music" },
];

const navIcons: Record<string, React.ReactNode> = {
  home: <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
  tutor: <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />,
  knowledge: <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />,
  "file-text": <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  "pencil-line": <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />,
  "bar-chart-3": <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
  route: <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />,
  music: <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />,
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ""}`} />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const COLAB_API = "https://relic-dweller-remix.ngrok-free.dev";
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

export default function MusicPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [modelProvider, setModelProvider] = useState<"heartmula" | "musicgen">("heartmula");
  const [mood, setMood] = useState("Focused");
  const [instrument, setInstrument] = useState("Ambient Synth");
  const [searchInput, setSearchInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [latestAudio, setLatestAudio] = useState<string | null>(null);

  const { play: playTrack, currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = usePlayer();

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, GeneratedTrack[]>>({});
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [trackMenuOpen, setTrackMenuOpen] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("generated_tracks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTracks(data as GeneratedTrack[]);
    setHistoryLoading(false);
  }, [user]);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setPlaylists(data as Playlist[]);
  }, [user]);

  const fetchPlaylistTracks = useCallback(async (playlistId: string) => {
    const { data: ptData } = await supabase
      .from("playlist_tracks")
      .select("track_id")
      .eq("playlist_id", playlistId);
    if (!ptData || ptData.length === 0) {
      setPlaylistTracks((prev) => ({ ...prev, [playlistId]: [] }));
      return;
    }
    const trackIds = ptData.map((pt: { track_id: string }) => pt.track_id);
    const { data: trData } = await supabase
      .from("generated_tracks")
      .select("*")
      .in("id", trackIds)
      .order("created_at", { ascending: false });
    if (trData) setPlaylistTracks((prev) => ({ ...prev, [playlistId]: trData as GeneratedTrack[] }));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTracks();
      fetchPlaylists();
    }
  }, [user, fetchTracks, fetchPlaylists]);

  useEffect(() => {
    if (selectedPlaylistId) fetchPlaylistTracks(selectedPlaylistId);
  }, [selectedPlaylistId, fetchPlaylistTracks]);

  const enhancePromptWithGemini = async (userText: string, moodVal: string, instrumentVal: string) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a music generation assistant. The user wants a focus/study track.
Mood: ${moodVal}
Instrument: ${instrumentVal}
User's description: "${userText}"

Generate lyrics (a short verse, 2-4 lines) and a rich prompt.
Return JSON: { "lyrics": "...", "enhanced_prompt": "..." }.
Keep lyrics under 80 characters. Enhanced prompt: 1-2 sentences describing the musical vibe.`
          }]
        }]
      })
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    setLatestAudio(null);

    try {
      let promptText = `${mood} study music with ${instrument}`;
      let lyricsText = "";

      if (searchInput.trim()) {
        try {
          const geminiResult = await enhancePromptWithGemini(searchInput, mood, instrument);
          promptText = geminiResult.enhanced_prompt || promptText;
          lyricsText = geminiResult.lyrics || "";
        } catch {
          promptText = searchInput.trim();
        }
      }

      const endpoint = modelProvider === "musicgen" ? "/generate-musicgen" : "/generate";
      const body = modelProvider === "musicgen"
        ? { prompt: lyricsText ? `${lyricsText}\n\n${promptText}` : promptText, duration: 30 }
        : { prompt: promptText, lyrics: lyricsText, duration: 30 };

      const res = await fetch(`${COLAB_API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `API error: ${res.status}`);
      }

      const result = await res.json();
      const audio_url = `/api/proxy-audio?url=${encodeURIComponent(result.audio_url)}`;

      if (!audio_url) {
        throw new Error("Server returned no audio_url");
      }

      const title = searchInput.trim()
        ? `${searchInput.trim().slice(0, 40)}${searchInput.trim().length > 40 ? "..." : ""}`
        : `${mood} ${instrument} Track`;

      // Always show track in UI immediately (skip DB if it fails)
      const newTrack: GeneratedTrack = {
        id: `${Date.now()}`,
        title,
        prompt: promptText,
        mood,
        instrument,
        lyrics: lyricsText || null,
        audio_url,
        duration: 30,
        created_at: new Date().toISOString(),
        user_id: user!.id,
      };
      setTracks((prev) => [newTrack, ...prev]);
      setLatestAudio(audio_url);
      playTrack(newTrack);

      try {
        await supabase.from("generated_tracks").insert({
          user_id: user!.id, title, prompt: promptText,
          mood, instrument, lyrics: lyricsText || null,
          audio_url, duration: 30,
        });
      } catch {
        // DB not required — audio works from state
      }

      setSearchInput("");
      setGenerationError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      console.error("Generation failed:", msg, err);
      setGenerationError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const deleteTrack = async (trackId: string) => {
    await supabase.from("generated_tracks").delete().eq("id", trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const { data } = await supabase
      .from("playlists")
      .insert({ user_id: user!.id, name: newPlaylistName.trim() })
      .select()
      .single();
    if (data) setPlaylists((prev) => [data as Playlist, ...prev]);
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
  };

  const deletePlaylist = async (playlistId: string) => {
    await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId);
    await supabase.from("playlists").delete().eq("id", playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
  };

  const addTrackToPlaylist = async (trackId: string, playlistId: string) => {
    const exists = playlistTracks[playlistId]?.some((t) => t.id === trackId);
    if (exists) return;
    const position = (playlistTracks[playlistId]?.length || 0) + 1;
    await supabase.from("playlist_tracks").insert({ playlist_id: playlistId, track_id: trackId, position });
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      setPlaylistTracks((prev) => ({
        ...prev,
        [playlistId]: [...(prev[playlistId] || []), track],
      }));
    }
    setTrackMenuOpen(null);
  };

  const removeTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    await supabase.from("playlist_tracks").delete().match({ playlist_id: playlistId, track_id: trackId });
    setPlaylistTracks((prev) => ({
      ...prev,
      [playlistId]: (prev[playlistId] || []).filter((t) => t.id !== trackId),
    }));
  };

  const activeTrack = tracks.length > 0 ? tracks[0] : null;
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Student";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">

      {/* Left Sidebar */}
      <SidebarLeft currentPage="music" />

      {/* Center Workspace (flex-1) */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">

        {/* Hero Section */}
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">PRO PLAN</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Level 24</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Audio Intelligence</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Your Focus. Your Sound.</h1>
            <p className="text-xl font-medium opacity-80 mb-8">AI-generated music tailored to your learning style.</p>
            <button className="bg-black text-white font-bold py-4 px-8 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-3 w-fit shadow-2xl cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create New Ambience
            </button>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 -mt-16 px-12 pb-24 overflow-y-auto space-y-12">

          {/* Currently Playing */}
          {activeTrack && (
          <section className="glass-card rounded-[32px] p-8 flex items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 flex items-end h-full music-waveform opacity-20">
              <div className="wave-bar-active w-1 bg-cyber-yellow rounded-full" style={{ height: "24px", animationDelay: "0.1s" }} />
              <div className="wave-bar-active w-1 bg-cyber-yellow rounded-full" style={{ height: "32px", animationDelay: "0.3s" }} />
              <div className="wave-bar-active w-1 bg-cyber-yellow rounded-full" style={{ height: "16px", animationDelay: "0.5s" }} />
              <div className="wave-bar-active w-1 bg-cyber-yellow rounded-full" style={{ height: "28px", animationDelay: "0.2s" }} />
              <div className="wave-bar-active w-1 bg-cyber-yellow rounded-full" style={{ height: "20px", animationDelay: "0.4s" }} />
            </div>
            <div className="w-32 h-32 rounded-2xl bg-black border border-cyber-yellow/30 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/20 to-transparent" />
              <svg className="w-10 h-10 relative z-10 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{activeTrack.title}</h2>
                  <p className="text-white/40 text-sm">
                    {activeTrack.mood && activeTrack.instrument
                      ? `${activeTrack.mood} \u2022 ${activeTrack.instrument} \u2022 Generated ${timeAgo(activeTrack.created_at)}`
                      : "Aether Original"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 cursor-pointer hover:text-cyber-yellow transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
                  </svg>
                  <div
                    className="w-12 h-12 rounded-full bg-cyber-yellow text-black flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    )}
                  </div>
                  <svg className="w-6 h-6 cursor-pointer hover:text-cyber-yellow transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-yellow [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                  style={{
                    background: `linear-gradient(to right, rgb(253,224,71) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.05) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
                  }}
                />
              </div>
            </div>
          </section>
          )}

          {/* History */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-1">{selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.name || "Playlist" : "History"}</h3>
                <p className="text-sm text-white/40">
                  {selectedPlaylistId
                    ? `${playlistTracks[selectedPlaylistId]?.length || 0} tracks`
                    : `${tracks.length} generated tracks`}
                </p>
              </div>
            </div>

            {historyLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[24px]" />)}
              </div>
            ) : latestAudio && tracks.length > 0 && (
              <div className="glass-card rounded-[24px] p-4 mb-4 border-cyber-yellow/50">
                <h4 className="text-xs font-semibold text-cyber-yellow mb-2">Latest Generated Track</h4>
                <audio controls className="w-full" src={latestAudio} preload="auto" />
                <a href={latestAudio} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyber-yellow/70 hover:underline mt-1 inline-block">Download</a>
              </div>
            )}

            {historyLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[24px]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {(selectedPlaylistId
                  ? (playlistTracks[selectedPlaylistId] || [])
                  : tracks
                ).map((track) => (
                  <div key={track.id} className="glass-card rounded-[24px] p-5 hover:border-cyber-yellow/30 transition-all group relative">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-cyber-yellow/50 transition-all">
                        <svg className="w-6 h-6 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{track.title}</h4>
                        <p className="text-[10px] text-white/40 mt-1">{timeAgo(track.created_at)}</p>
                        {track.audio_url && (
                          <audio controls className="mt-2 w-full h-8" src={track.audio_url} preload="none" />
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      {!selectedPlaylistId && (
                        <div className="relative">
                          <button
                            onClick={() => setTrackMenuOpen(trackMenuOpen === track.id ? null : track.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-cyber-yellow transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                          {trackMenuOpen === track.id && (
                            <div className="absolute right-0 top-8 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[160px] z-20 shadow-2xl">
                              {playlists.length === 0 ? (
                                <p className="text-[10px] text-white/40 px-2 py-1">No playlists yet</p>
                              ) : (
                                playlists.map((pl) => (
                                  <button
                                    key={pl.id}
                                    onClick={() => addTrackToPlaylist(track.id, pl.id)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-white/70 hover:text-cyber-yellow hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                  >
                                    + {pl.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => selectedPlaylistId ? removeTrackFromPlaylist(track.id, selectedPlaylistId) : deleteTrack(track.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400/60 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {tracks.length === 0 && !selectedPlaylistId && (
                  <div className="col-span-3 glass-card rounded-[32px] p-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                    <p className="text-white/40 text-sm font-medium">No tracks yet. Generate your first one!</p>
                  </div>
                )}
                {selectedPlaylistId && (playlistTracks[selectedPlaylistId]?.length || 0) === 0 && (
                  <div className="col-span-3 glass-card rounded-[32px] p-12 text-center">
                    <p className="text-white/40 text-sm font-medium">This playlist is empty. Add tracks from your history.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Preset Ambiences */}
          <section className="space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-1">Preset Ambiencies</h3>
              <p className="text-sm text-white/40">Quick-start curated focus environments</p>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {[
                { icon: "trees", label: "Forest", tags: "Birds \u2022 Wind \u2022 Organic" },
                { icon: "cloud-rain", label: "Midnight Rain", tags: "Thunder \u2022 Lo-fi \u2022 Steady" },
                { icon: "rocket", label: "Space Void", tags: "Synth \u2022 Drone \u2022 Deep" },
                { icon: "coffee", label: "Lofi Cafe", tags: "Vinyl \u2022 Chords \u2022 Chill" },
              ].map((amb) => (
                <div key={amb.label} className="glass-card rounded-[32px] p-6 hover:border-cyber-yellow/40 hover:scale-[1.02] transition-all group cursor-pointer flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-black mb-4 flex items-center justify-center border border-white/5 group-hover:border-cyber-yellow/50">
                    {amb.icon === "trees" && (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 21v-6m0 0l-2.5-2.5M12 9l2.5 2.5M12 3v6m0 0l-2.5-2.5M12 9l2.5-2.5M3 21h18M3 3h18" />
                      </svg>
                    )}
                    {amb.icon === "cloud-rain" && (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                      </svg>
                    )}
                    {amb.icon === "rocket" && (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </svg>
                    )}
                    {amb.icon === "coffee" && (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                      </svg>
                    )}
                  </div>
                  <h4 className="font-bold mb-1">{amb.label}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-6">{amb.tags}</p>
                  <button className="mt-auto bg-white/5 border border-white/10 text-xs font-bold py-2 rounded-full group-hover:bg-cyber-yellow group-hover:text-black transition-all cursor-pointer">Start</button>
                </div>
              ))}
            </div>
          </section>

          {/* AI Studio Generator */}
          <section className="glass-card rounded-[32px] p-10 grid grid-cols-2 gap-12 relative overflow-hidden">
            <div className="space-y-8 z-10">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">AI Studio Generator</h3>
                <p className="text-sm text-white/40">Define your sonic parameters for precision focus.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mood Profile</label>
                  <div className="flex flex-wrap gap-2">
                    {["Focused", "Calm", "Energized", "Creative"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${mood === m ? "border-cyber-yellow bg-cyber-yellow text-black" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Instrumental Preference</label>
                  <div className="flex flex-wrap gap-2">
                    {["Piano", "Ambient Synth", "Acoustic Guitar"].map((inst) => (
                      <button
                        key={inst}
                        onClick={() => setInstrument(inst)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${instrument === inst ? "border-cyber-yellow bg-cyber-yellow/10 text-cyber-yellow" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Model</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModelProvider("heartmula")}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${modelProvider === "heartmula" ? "border-purple-400 bg-purple-400/10 text-purple-300" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      HeartMuLa (Lyrics)
                    </button>
                    <button
                      onClick={() => setModelProvider("musicgen")}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${modelProvider === "musicgen" ? "border-blue-400 bg-blue-400/10 text-blue-300" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      MusicGen (Instrumental)
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-cyber-yellow text-black font-bold py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(253,224,71,0.2)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {modelProvider === "heartmula" ? "Generate with HeartMuLa" : "Generate with MusicGen"}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </>
                  )}
                </button>
                {generationError && <p className="text-red-400 text-sm font-bold text-center mt-4 bg-red-400/10 rounded-xl p-3">{generationError}</p>}
            </div>
            </div>
            <div className="bg-black/20 rounded-[32px] border border-white/5 p-8 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-cyber-yellow/5 to-transparent pointer-events-none" />
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all group-hover:bg-cyber-yellow group-hover:text-black">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-8.159-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.18-1.14-.6-.12-.48.18-1.02.6-1.14 4.2-1.32 9.54-.66 13.14 1.56.36.24.48.78.301 1.2v.06zm.12-3.36c-3.84-2.28-10.14-2.52-13.8-1.38-.48.12-1.02-.18-1.14-.6-.12-.48.18-1.02.6-1.14 4.2-1.26 11.28-1.02 15.66 1.56.54.3.66 1.02.36 1.56-.24.48-.96.66-1.56.36z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2">Import Spotify Library</h4>
              <p className="text-sm text-white/40 max-w-[240px] mx-auto mb-6">Seamlessly connect your playlists and let AI remix them for focus.</p>
              <button className="bg-[#1DB954] text-white px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all mx-auto">
                Connect Spotify
              </button>
            </div>
          </section>

          <div className="pt-12 flex items-center justify-between opacity-30 grayscale">
            <span className="text-[10px] font-bold tracking-widest">INTEGRATED WITH</span>
            <div className="flex gap-12">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-8.159-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.18-1.14-.6-.12-.48.18-1.02.6-1.14 4.2-1.32 9.54-.66 13.14 1.56.36.24.48.78.301 1.2v.06zm.12-3.36c-3.84-2.28-10.14-2.52-13.8-1.38-.48.12-1.02-.18-1.14-.6-.12-.48.18-1.02.6-1.14 4.2-1.26 11.28-1.02 15.66 1.56.54.3.66 1.02.36 1.56-.24.48-.96.66-1.56.36z" />
                </svg>
                <span className="font-bold tracking-tighter">Spotify</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 0-.36-.06-.52-.18-1.48-1.12-3.48-1.68-5.6-1.68-2.12 0-4.12.56-5.6 1.68-.16.12-.36.18-.56.18-.24 0-.48-.1-.66-.28-.18-.18-.28-.42-.28-.68 0-.26.1-.5.28-.68 1.78-1.34 4.2-2.02 6.82-2.02s5.04.68 6.82 2.02c.18.14.28.38.28.68 0 .26-.1.5-.28.68-.14.14-.34.22-.54.22z" />
                </svg>
                <span className="font-bold tracking-tighter">Music</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 0-.36-.06-.52-.18-1.48-1.12-3.48-1.68-5.6-1.68-2.12 0-4.12.56-5.6 1.68-.16.12-.36.18-.56.18-.24 0-.48-.1-.66-.28-.18-.18-.28-.42-.28-.68 0-.26.1-.5.28-.68 1.78-1.34 4.2-2.02 6.82-2.02s5.04.68 6.82 2.02c.18.14.28.38.28.68 0 .26-.1.5-.28.68-.14.14-.34.22-.54.22z" />
                </svg>
                <span className="font-bold tracking-tighter">Soundcloud</span>
              </div>
            </div>
          </div>

        </div>

        {/* Composer Bar */}
      <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none px-12">
        <div className="pointer-events-auto">
          <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
            <div className="bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
              <button className="w-12 h-12 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input type="text" placeholder="Describe the track you want..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }} className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-white placeholder-white/40 outline-none" />
              <div className="flex items-center gap-2">
                <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <button onClick={handleGenerate} disabled={generating} className="w-12 h-12 rounded-full bg-cyber-yellow text-black shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    {/* Right Sidebar */}
    <SidebarRight />

    <div className="fixed bottom-10 left-10 space-y-3 z-50 pointer-events-none">
      {generating && (
      <div className="bg-black/80 backdrop-blur-xl border border-cyber-yellow/30 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl pointer-events-auto">
        <div className="w-2 h-2 bg-cyber-yellow rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">🎵 AI generating focus track...</span>
      </div>
      )}
    </div>

    </div>
  );
}
