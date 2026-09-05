import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { downloadAudio, enhanceMusicPrompt, generateTrack } from '@/lib/api';
import type { GeneratedTrack } from '@/lib/types';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import { EditorialPressable, EditorialPageHeader, SERIF } from '@/components/editorial';
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

const GREEN = '#3F5C3A';
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <EditorialPageHeader kicker="Ambience &amp; focus" title="Focus Music" />

        {/* Generate card */}
        <View style={[styles.card, styles.generateCard]}>
          <Text style={styles.sectionLabel}>DESCRIBE YOUR TRACK</Text>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="e.g. rain on a window, deep focus"
            placeholderTextColor="#8A8478"
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

          <EditorialPressable
            onPress={handleGenerate}
            disabled={generating}
            pressShadow="1px 1px 0 0 #2D3436"
            accessibilityRole="button"
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          >
            {!generating ? <Icon icon={Sparkles} size={15} color="#FDFBF7" strokeWidth={2.2} /> : null}
            <Text style={styles.generateBtnText}>{generating ? 'Generating...' : 'Generate'}</Text>
          </EditorialPressable>
        </View>

        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Icon icon={AlertCircle} size={18} color="#C9772E" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Now playing */}
        {activeTrack ? (
          <View style={[styles.card, styles.nowPlaying]}>
            <View style={styles.nowPlayingTop}>
              <View style={styles.cover}>
                <Icon icon={Music} size={22} color="#FDFBF7" />
              </View>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle} numberOfLines={1}>{activeTrack.title}</Text>
                <Text style={styles.nowPlayingMeta}>
                  {activeTrack.mood && activeTrack.instrument
                    ? `${activeTrack.mood} â€¢ ${activeTrack.instrument} â€¢ Generated ${timeAgo(activeTrack.created_at)}`
                    : 'Aether Original'}
                </Text>
                <Text style={styles.nowPlayingMeta}>
                  {status.isLoaded && status.duration ? `${Math.floor(status.currentTime)}s / ${Math.floor(status.duration)}s` : 'Loading audioâ€¦'}
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
                <Icon icon={SkipBack} size={18} color="#2D3436" />
              </Pressable>
              <Pressable
                onPress={togglePlay}
                disabled={generating}
                accessibilityRole="button"
                accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                style={({ pressed }) => [styles.playBtn, generating && { opacity: 0.5 }, pressed && !generating && { opacity: 0.85 }]}
              >
                <Icon icon={generating ? Loader : status.playing ? Pause : Play} size={22} color="#FDFBF7" />
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
                <Icon icon={SkipForward} size={18} color="#2D3436" />
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
            <Icon icon={Music} size={30} color="#8A8478" />
            <Text style={styles.emptyTitle}>No tracks yet</Text>
            <Text style={styles.emptyDesc}>
              Generate your first AI track above â€” describe a scene, pick a mood, and hit Generate.
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
                      <Icon icon={Pause} size={16} color="#FDFBF7" />
                    ) : (
                      <Icon icon={Play} size={16} color={isActive ? '#FDFBF7' : '#8A8478'} />
                    )}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, isActive && { color: GREEN }]} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.trackMeta}>
                      {t.mood && t.instrument ? `${t.mood} â€¢ ${t.instrument}` : 'Aether Original'} â€¢ {timeAgo(t.created_at)}
                    </Text>
                  </View>
                  <Pressable onPress={() => deleteTrack(t.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete track">
                    <Icon icon={Trash2} size={16} color="#8A8478" />
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  pageTitle: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: '#2D3436', marginBottom: 20 },

  card: {
    backgroundColor: '#FDFBF7',
    borderWidth: 2,
    borderColor: '#2D3436',
    boxShadow: '4px 4px 0 0 #2D3436',
  },

  generateCard: {
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  input: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2D3436',
    backgroundColor: '#FDFBF7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#2D3436',
    fontSize: 15,
    minHeight: 44,
    maxHeight: 100,
  },
  sectionLabel: {
    fontFamily: SERIF,
    fontSize: 11,
    fontWeight: '600',
    color: '#555E61',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderColor: '#2D3436',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: GREEN_SOFT, borderColor: GREEN },
  chipText: { fontFamily: SERIF, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: '#3F5C3A', textTransform: 'uppercase' },
  chipTextActive: { color: '#2D3436' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: '#2D3436',
    borderRadius: 255,
    borderTopLeftRadius: 255,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 225,
    borderBottomRightRadius: 15,
    paddingVertical: 14,
    marginTop: 20,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: '#FDFBF7', textTransform: 'uppercase' },

  errorCard: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 8,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: { flex: 1, fontFamily: SERIF, fontSize: 14, color: '#C9772E', lineHeight: 20 },

  nowPlaying: {
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 8,
    padding: 18,
    marginBottom: 24,
  },
  nowPlayingTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: '#2D3436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingInfo: { flex: 1, gap: 2 },
  nowPlayingTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436' },
  nowPlayingMeta: { fontFamily: SERIF, fontSize: 12, color: '#8A8478' },
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
    backgroundColor: '#FDFBF7',
    borderWidth: 2,
    borderColor: '#2D3436',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: '#2D3436',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '3px 3px 0 0 #2D3436',
  },

  libraryTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: '#2D3436', marginBottom: 14 },
  emptyCard: {
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 8,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436', marginTop: 12 },
  emptyDesc: { fontFamily: SERIF, fontSize: 14, color: '#555E61', textAlign: 'center', lineHeight: 20 },

  trackCard: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trackCover: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EDE3',
    borderWidth: 2,
    borderColor: '#2D3436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCoverActive: { backgroundColor: GREEN },
  trackInfo: { flex: 1, gap: 2 },
  trackTitle: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: '#2D3436' },
  trackMeta: { fontFamily: SERIF, fontSize: 12, color: '#8A8478' },
});