import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { downloadAudio, enhanceMusicPrompt, generateTrack } from '@/lib/api';
import type { GeneratedTrack } from '@/lib/types';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import {
  AlertCircle,
  Loader,
  Music,
  Pause,
  Play,
  Sparkles,
  SkipBack,
  SkipForward,
  Trash2,
} from '@/components/glass/icons';

const GREEN = '#6B8E61';
const GREEN_SOFT = '#E8F0E5';

const MOODS = ['Focused', 'Chill', 'Energetic', 'Dreamy'];
const INSTRUMENTS = ['Ambient Synth', 'Piano', 'Lo-fi Beats', 'Strings'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MusicTab() {
  const { session: authSession } = useAuth();
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [instrument, setInstrument] = useState(INSTRUMENTS[0]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [activeTrack, setActiveTrack] = useState<GeneratedTrack | null>(null);
  const player = useAudioPlayer(activeTrack?.localUri ?? null);
  const status = useAudioPlayerStatus(player);

  const fetchTracks = useCallback(async () => {
    if (!authSession) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('generated_tracks')
      .select('*')
      .eq('user_id', authSession.user.id)
      .order('created_at', { ascending: false });
    if (data) setTracks(data as GeneratedTrack[]);
    setLoading(false);
  }, [authSession]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const togglePlay = () => {
    if (!activeTrack) return;
    if (status.playing) player.pause();
    else player.play();
  };

  const playTrack = async (track: GeneratedTrack) => {
    try {
      if (!track.localUri) {
        const localUri = await downloadAudio(track.audio_url);
        track.localUri = localUri;
        setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, localUri } : t)));
      }
      setActiveTrack({ ...track });
    } catch {
      Alert.alert('Playback unavailable', 'Could not load this track.');
    }
  };

  const handleGenerate = async () => {
    if (!authSession) return;
    setGenerating(true);
    setError('');
    try {
      let promptText = `${mood} study music with ${instrument}`;
      let lyricsText = '';

      if (searchInput.trim()) {
        try {
          const enhanced = await enhanceMusicPrompt({ userText: searchInput.trim(), mood, instrument });
          promptText = enhanced.enhanced_prompt || promptText;
          lyricsText = enhanced.lyrics || '';
        } catch {
          promptText = searchInput.trim();
        }
      }

      const { audio_url } = await generateTrack({ prompt: promptText, lyrics: lyricsText, duration: 30 });

      const title = searchInput.trim()
        ? `${searchInput.trim().slice(0, 40)}${searchInput.trim().length > 40 ? '...' : ''}`
        : `${mood} ${instrument} Track`;

      const newTrack: GeneratedTrack = {
        id: `${Date.now()}`,
        user_id: authSession.user.id,
        title,
        prompt: promptText,
        mood,
        instrument,
        lyrics: lyricsText || null,
        audio_url,
        duration: 30,
        created_at: new Date().toISOString(),
      };
      setTracks((prev) => [newTrack, ...prev]);
      playTrack(newTrack);

      await supabase.from('generated_tracks').insert({
        user_id: authSession.user.id,
        title,
        prompt: promptText,
        mood,
        instrument,
        lyrics: lyricsText || null,
        audio_url,
        duration: 30,
      });
      await fetchTracks();

      setSearchInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const deleteTrack = (trackId: string) => {
    Alert.alert('Delete track', 'Remove this track from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('generated_tracks').delete().eq('id', trackId);
          setTracks((prev) => prev.filter((t) => t.id !== trackId));
          if (activeTrack?.id === trackId) {
            player.pause();
            setActiveTrack(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Focus Music</Text>

        {/* Generate card */}
        <View style={[styles.card, styles.generateCard]}>
          <Text style={styles.sectionLabel}>DESCRIBE YOUR TRACK</Text>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="e.g. rain on a window, deep focus"
            placeholderTextColor="#BBB"
            style={styles.input}
            multiline
          />

          <Text style={styles.sectionLabel}>MOOD</Text>
          <View style={styles.chipRow}>
            {MOODS.map((m) => {
              const active = mood === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMood(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>INSTRUMENT</Text>
          <View style={styles.chipRow}>
            {INSTRUMENTS.map((ins) => {
              const active = instrument === ins;
              return (
                <Pressable
                  key={ins}
                  onPress={() => setInstrument(ins)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{ins.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleGenerate}
            disabled={generating}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.generateBtn,
              generating && styles.generateBtnDisabled,
              pressed && !generating && { opacity: 0.9 },
            ]}
          >
            {!generating ? <Icon icon={Sparkles} size={15} color="#FFF" strokeWidth={2.2} /> : null}
            <Text style={styles.generateBtnText}>{generating ? 'Generating...' : 'Generate'}</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Icon icon={AlertCircle} size={18} color="#D97B66" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Now playing */}
        {activeTrack ? (
          <View style={[styles.card, styles.nowPlaying]}>
            <View style={styles.nowPlayingTop}>
              <View style={styles.cover}>
                <Icon icon={Music} size={22} color="#FFF" />
              </View>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle} numberOfLines={1}>{activeTrack.title}</Text>
                <Text style={styles.nowPlayingMeta}>
                  {activeTrack.mood && activeTrack.instrument
                    ? `${activeTrack.mood} • ${activeTrack.instrument} • Generated ${timeAgo(activeTrack.created_at)}`
                    : 'Aether Original'}
                </Text>
                <Text style={styles.nowPlayingMeta}>
                  {status.isLoaded && status.duration ? `${Math.floor(status.currentTime)}s / ${Math.floor(status.duration)}s` : 'Loading audio…'}
                </Text>
              </View>
            </View>
            <View style={styles.controls}>
              <Pressable
                onPress={() => {
                  const idx = tracks.findIndex((t) => t.id === activeTrack.id);
                  const prev = tracks[idx - 1] ?? tracks[tracks.length - 1];
                  if (prev) playTrack(prev);
                }}
                accessibilityRole="button"
                accessibilityLabel="Previous track"
                style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.7 }]}
              >
                <Icon icon={SkipBack} size={18} color="#333" />
              </Pressable>
              <Pressable
                onPress={togglePlay}
                disabled={generating}
                accessibilityRole="button"
                accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                style={({ pressed }) => [styles.playBtn, generating && { opacity: 0.5 }, pressed && !generating && { opacity: 0.85 }]}
              >
                <Icon icon={generating ? Loader : status.playing ? Pause : Play} size={22} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={() => {
                  const idx = tracks.findIndex((t) => t.id === activeTrack.id);
                  const next = tracks[idx + 1] ?? tracks[0];
                  if (next) playTrack(next);
                }}
                accessibilityRole="button"
                accessibilityLabel="Next track"
                style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.7 }]}
              >
                <Icon icon={SkipForward} size={18} color="#333" />
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.libraryTitle}>Your Library</Text>

        {loading ? (
          <View style={styles.card}>
            <Text style={styles.emptyDesc}>Loading tracks...</Text>
          </View>
        ) : tracks.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Icon icon={Music} size={30} color="#CCC" />
            <Text style={styles.emptyTitle}>No tracks yet</Text>
            <Text style={styles.emptyDesc}>
              Generate your first AI track above — describe a scene, pick a mood, and hit Generate.
            </Text>
          </View>
        ) : (
          tracks.map((t) => {
            const isActive = activeTrack?.id === t.id;
            return (
              <View key={t.id || t.created_at} style={[styles.card, styles.trackCard]}>
                <Pressable onPress={() => playTrack(t)} accessibilityRole="button" style={styles.trackRow}>
                  <View style={[styles.trackCover, isActive && styles.trackCoverActive]}>
                    {isActive && status.playing ? (
                      <Icon icon={Pause} size={16} color="#FFF" />
                    ) : (
                      <Icon icon={Play} size={16} color={isActive ? '#FFF' : '#999'} />
                    )}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, isActive && { color: GREEN }]} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.trackMeta}>
                      {t.mood && t.instrument ? `${t.mood} • ${t.instrument}` : 'Aether Original'} • {timeAgo(t.created_at)}
                    </Text>
                  </View>
                  <Pressable onPress={() => deleteTrack(t.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete track">
                    <Icon icon={Trash2} size={16} color="#CCC" />
                  </Pressable>
                </Pressable>
              </View>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 20 },

  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3EDE3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },

  // Generate card
  generateCard: { borderRadius: 28, padding: 20, marginBottom: 16 },
  input: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#F9F6F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#333',
    fontSize: 15,
    minHeight: 44,
    maxHeight: 100,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BBB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: '#999' },
  chipTextActive: { color: GREEN },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 20,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Error
  errorCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: { flex: 1, fontSize: 14, color: '#D97B66', lineHeight: 20 },

  // Now playing
  nowPlaying: { borderRadius: 24, padding: 18, marginBottom: 24 },
  nowPlayingTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingInfo: { flex: 1, gap: 2 },
  nowPlayingTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  nowPlayingMeta: { fontSize: 12, color: '#999' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 18,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  // Library
  libraryTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 14 },
  emptyCard: { borderRadius: 24, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },

  trackCard: { borderRadius: 20, padding: 14, marginBottom: 12 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trackCover: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCoverActive: { backgroundColor: GREEN },
  trackInfo: { flex: 1, gap: 2 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  trackMeta: { fontSize: 12, color: '#999' },
});
