import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { downloadAudio, enhanceMusicPrompt, generateTrack } from '@/lib/api';
import type { GeneratedTrack } from '@/lib/types';
import { useTheme, glassRadius, spacing, type AccentKey, type GlassTheme } from '@/theme';
import { GlassActionPill, GlassPageHeader } from '@/components/glass/GlassPageHeader';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { AlertCircle, Loader, Music, Pause, Play, Sparkles, SkipBack, SkipForward, Trash2 } from '@/components/glass/icons';

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
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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

  const accent: AccentKey = 'audio';
  const solid = theme.accents[accent].solid;

  return (
    <GlassScreen scroll accent={accent}>
      <GlassPageHeader
        title="Focus Music"
        actions={
          <GlassActionPill
            label={generating ? 'Generating...' : 'Generate'}
            icon={generating ? undefined : Sparkles}
            onPress={handleGenerate}
            active
            accent={accent}
            disabled={generating}
          />
        }
      />

      <GlassCard>
        <Text style={theme.glassType.label}>DESCRIBE YOUR TRACK</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="e.g. rain on a window, deep focus"
            placeholderTextColor={theme.light.inkFaint}
            style={styles.input}
            multiline
          />
        </View>
        <Text style={[theme.glassType.caption, styles.sectionLabel]}>MOOD</Text>
        <View style={styles.chipRow}>
          {MOODS.map((m) => {
            const active = mood === m;
            return (
              <Pressable key={m} onPress={() => setMood(m)} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <GlassSurface
                  radius={glassRadius.pill}
                  intensity={active ? 'thick' : 'regular'}
                  fill={active ? theme.glass.fillStrong : theme.glass.fillSubtle}
                  tintColor={active ? theme.accents[accent].wash : undefined}
                  style={styles.chip}
                >
                  <Text style={[styles.chipText, { color: active ? solid : theme.light.inkMuted }]}>{m.toUpperCase()}</Text>
                </GlassSurface>
              </Pressable>
            );
          })}
        </View>
        <Text style={[theme.glassType.caption, styles.sectionLabel]}>INSTRUMENT</Text>
        <View style={styles.chipRow}>
          {INSTRUMENTS.map((ins) => {
            const active = instrument === ins;
            return (
              <Pressable key={ins} onPress={() => setInstrument(ins)} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <GlassSurface
                  radius={glassRadius.pill}
                  intensity={active ? 'thick' : 'regular'}
                  fill={active ? theme.glass.fillStrong : theme.glass.fillSubtle}
                  tintColor={active ? theme.accents[accent].wash : undefined}
                  style={styles.chip}
                >
                  <Text style={[styles.chipText, { color: active ? solid : theme.light.inkMuted }]}>{ins.toUpperCase()}</Text>
                </GlassSurface>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      {error ? (
        <GlassCard style={styles.errorCard}>
          <View style={styles.errorRow}>
            <Icon icon={AlertCircle} size={18} color={theme.accents.data.solid} />
            <Text style={[styles.errorText, { color: theme.accents.data.solid }]}>{error}</Text>
          </View>
        </GlassCard>
      ) : null}

      {activeTrack ? (
        <GlassCard style={styles.nowPlaying}>
          <View style={styles.nowPlayingTop}>
            <View style={[styles.cover, { backgroundColor: solid }]}>
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
            <GlassIconButton icon={SkipBack} onPress={() => {
              const idx = tracks.findIndex((t) => t.id === activeTrack.id);
              const prev = tracks[idx - 1] ?? tracks[tracks.length - 1];
              if (prev) playTrack(prev);
            }} />
            <GlassIconButton icon={generating ? Loader : status.playing ? Pause : Play} large onPress={togglePlay} accent={accent} disabled={generating} />
            <GlassIconButton icon={SkipForward} onPress={() => {
              const idx = tracks.findIndex((t) => t.id === activeTrack.id);
              const next = tracks[idx + 1] ?? tracks[0];
              if (next) playTrack(next);
            }} />
          </View>
        </GlassCard>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={theme.glassType.subtitle}>Your Library</Text>
      </View>

      {loading ? (
        <GlassCard><Text style={theme.glassType.body}>Loading tracks...</Text></GlassCard>
      ) : tracks.length === 0 ? (
        <GlassCard>
          <View style={styles.empty}>
            <Icon icon={Music} size={30} color={theme.light.inkFaint} />
            <Text style={theme.glassType.subtitle}>No tracks yet</Text>
            <Text style={theme.glassType.body}>Generate your first AI track above — describe a scene, pick a mood, and hit Generate.</Text>
          </View>
        </GlassCard>
      ) : (
        tracks.map((t) => {
          const isActive = activeTrack?.id === t.id;
          return (
            <GlassCard key={t.id || t.created_at} style={styles.trackCard}>
              <Pressable onPress={() => playTrack(t)} accessibilityRole="button">
                <View style={styles.trackRow}>
                  <View style={[styles.trackCover, { backgroundColor: isActive ? solid : theme.inkEdge(0.08) }]}>
                    {isActive && status.playing ? (
                      <Icon icon={Pause} size={16} color="#FFF" />
                    ) : (
                      <Icon icon={Play} size={16} color={isActive ? '#FFF' : theme.light.inkMuted} />
                    )}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: isActive ? solid : theme.light.ink }]} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.trackMeta}>
                      {t.mood && t.instrument ? `${t.mood} • ${t.instrument}` : 'Aether Original'} • {timeAgo(t.created_at)}
                    </Text>
                  </View>
                  <Pressable onPress={() => deleteTrack(t.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete track">
                    <Icon icon={Trash2} size={16} color={theme.light.inkFaint} />
                  </Pressable>
                </View>
              </Pressable>
            </GlassCard>
          );
        })
      )}
    </GlassScreen>
  );
}

function GlassIconButton({ icon, onPress, large, accent, disabled }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  large?: boolean;
  accent?: AccentKey;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const size = large ? 56 : 44;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={styles.iconBtnWrap}>
      <GlassSurface
        radius={large ? 28 : 22}
        intensity="thick"
        fill={theme.glass.fillStrong}
        tintColor={accent ? theme.accents[accent].wash : undefined}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={icon} size={large ? 22 : 18} color={accent ? theme.accents[accent].solid : theme.light.ink} />
      </GlassSurface>
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  inputWrap: {
    marginTop: spacing.sm,
    borderRadius: glassRadius.card,
    backgroundColor: theme.inkEdge(0.05),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: { color: theme.light.ink, fontSize: 15, minHeight: 40, maxHeight: 90 },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipText: { ...theme.glassType.label, fontSize: 12 },
  errorCard: { marginTop: spacing.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorText: { ...theme.glassType.body, flex: 1 },
  nowPlaying: { marginTop: spacing.md },
  nowPlayingTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  cover: { width: 52, height: 52, borderRadius: glassRadius.card, alignItems: 'center', justifyContent: 'center' },
  nowPlayingInfo: { flex: 1 },
  nowPlayingTitle: { ...theme.glassType.subtitle, fontSize: 16 },
  nowPlayingMeta: { ...theme.glassType.caption, color: theme.light.inkMuted, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  iconBtnWrap: { marginHorizontal: spacing.xs },
  sectionRow: { marginTop: spacing.lg, marginBottom: spacing.md },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  trackCard: { marginBottom: spacing.md },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trackCover: { width: 40, height: 40, borderRadius: glassRadius.lozenge, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { ...theme.glassType.label, fontSize: 14 },
  trackMeta: { ...theme.glassType.caption, color: theme.light.inkMuted, marginTop: 2 },
});
