import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { getProgress, type ProgressReport } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassStat } from '@/components/glass/GlassStat';
import { Icon } from '@/components/glass/Icon';
import { Activity, Check, Clock, Rocket, Target, Trophy } from '@/components/glass/icons';

export default function ProgressScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [data, setData] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
    try {
      setData(await getProgress(session.id));
    } catch {
      // keep data null; UI falls back to zeros
    }
    setLoading(false);
  }, [authSession, session]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const avgMastery = data?.avgMastery ?? 0;
  const BAR_DATA = data?.BAR_DATA ?? [
    { day: 'MON', height: 0, peak: false },
    { day: 'TUE', height: 0, peak: false },
    { day: 'WED', height: 0, peak: false },
    { day: 'THU', height: 0, peak: false },
    { day: 'FRI', height: 0, peak: false },
    { day: 'SAT', height: 0, peak: false },
    { day: 'SUN', height: 0, peak: false },
  ];
  const maxBar = Math.max(...BAR_DATA.map((b) => b.height), 1);

  return (
    <GlassScreen scroll accent="home">
      {/* Gradient hero */}
      <View style={styles.hero}>
        <LinearGradient
          colors={theme.accents.home.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroFill}
        />
        <View style={styles.heroIcon}>
          <Icon icon={Rocket} size={20} color="#8E77E6" strokeWidth={2} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroEyebrow}>PROGRESS CHECK-IN</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {session?.title || 'Your Session'}
          </Text>
        </View>
        <View style={styles.heroScore}>
          <Text style={styles.heroScoreValue}>{avgMastery}%</Text>
          <Text style={styles.heroScoreLabel}>MASTERY</Text>
        </View>
      </View>

      {loading ? (
        <GlassCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.accents.home.solid} size="small" />
            <Text style={theme.glassType.body}>Analyzing your progress...</Text>
          </View>
        </GlassCard>
      ) : (
        <>
          {/* Mastery + streak row */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <GlassStat value={`${avgMastery}%`} label="Mastery" accent="home" size="md" />
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <GlassStat value={String(data?.accuracyStreak ?? 0)} label="Day Streak" accent="audio" size="md" />
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <GlassStat value={String(data?.totalXP ?? 0)} label="Total XP" accent="vocab" size="md" />
            </GlassCard>
          </View>

          {/* Week bars */}
          <GlassCard>
            <Text style={styles.cardLabel}>ACTIVITY THIS WEEK</Text>
            <View style={styles.bars}>
              {BAR_DATA.map((b) => (
                <View key={b.day} style={styles.barCol}>
                  <View style={styles.barSlot}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(6, (b.height / maxBar) * 80),
                          backgroundColor: b.peak ? theme.accents.home.solid : 'rgba(124,96,228,0.25)',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, b.peak && { color: theme.accents.home.solid }]}>{b.day}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Stat grid */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <View style={styles.miniStat}>
                <Icon icon={Target} size={16} color={theme.accents.home.solid} />
                <Text style={styles.miniValue}>{data?.conceptsLearned ?? 0}</Text>
                <Text style={styles.miniLabel}>Concepts</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={styles.miniStat}>
                <Icon icon={Clock} size={16} color={theme.accents.field.solid} />
                <Text style={styles.miniValue}>{data?.studyHours ?? 0}h</Text>
                <Text style={styles.miniLabel}>Studied</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={styles.miniStat}>
                <Icon icon={Activity} size={16} color={theme.accents.audio.solid} />
                <Text style={styles.miniValue}>{data?.level ?? 1}</Text>
                <Text style={styles.miniLabel}>Level</Text>
              </View>
            </GlassCard>
          </View>

          {/* Strengths / weaknesses */}
          {(data?.strengths?.length ?? 0) > 0 ? (
            <GlassCard>
              <Text style={styles.cardLabel}>STRENGTHS</Text>
              {data!.strengths.map((s) => (
                <View key={s.name} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{s.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(s.mastery, 100)}%`, backgroundColor: theme.accents.audio.solid }]} />
                  </View>
                  <Text style={styles.barPct}>{Math.round(s.mastery)}%</Text>
                </View>
              ))}
            </GlassCard>
          ) : null}

          {(data?.weaknesses?.length ?? 0) > 0 ? (
            <GlassCard>
              <Text style={styles.cardLabel}>TO REVIEW</Text>
              {data!.weaknesses.map((w) => (
                <View key={w.name} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{w.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(w.mastery, 100)}%`, backgroundColor: theme.accents.vocab.solid }]} />
                  </View>
                  <Text style={styles.barPct}>{Math.round(w.mastery)}%</Text>
                </View>
              ))}
            </GlassCard>
          ) : null}

          {/* Milestones */}
          {(data?.milestones?.length ?? 0) > 0 ? (
            <GlassCard>
              <Text style={styles.cardLabel}>MILESTONES</Text>
              {data!.milestones.map((m, i) => (
                <View key={i} style={styles.milestoneRow}>
                  <View style={[styles.milestoneDot, m.completed && { backgroundColor: theme.accents.audio.solid }]}>
                    {m.completed ? <Icon icon={Check} size={11} color="#FFF" strokeWidth={3} /> : null}
                  </View>
                  <Text style={[styles.milestoneText, !m.completed && { color: theme.light.inkMuted }]} numberOfLines={2}>
                    {m.title}
                  </Text>
                </View>
              ))}
            </GlassCard>
          ) : null}

          {!session ? (
            <GlassCard>
              <Text style={theme.glassType.body}>Select a session from the Hub to see progress.</Text>
            </GlassCard>
          ) : null}

          <Pressable onPress={() => router.push('/(tabs)/tutor')} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
            <Icon icon={Trophy} size={16} color="#FFF" strokeWidth={2} />
            <Text style={styles.ctaText}>KEEP LEARNING</Text>
          </Pressable>
        </>
      )}
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: glassRadius.squircle,
    padding: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 2 },
  heroEyebrow: { ...theme.glassType.overline, fontSize: 9, color: 'rgba(142,119,230,0.9)' },
  heroTitle: { ...theme.glassType.title, fontSize: 19, lineHeight: 23, letterSpacing: -0.4, color: '#181425' },
  heroScore: { alignItems: 'flex-end' },
  heroScoreValue: { ...theme.glassType.label, fontSize: 22, color: '#181425', fontWeight: '800' },
  heroScoreLabel: { ...theme.glassType.overline, fontSize: 8, color: 'rgba(24,20,37,0.5)' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1 },
  cardLabel: { ...theme.glassType.overline, fontSize: 9, color: theme.light.inkMuted, marginBottom: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barSlot: { height: 80, justifyContent: 'flex-end' },
  bar: { width: '70%', borderRadius: 4, minHeight: 6 },
  barDay: { ...theme.glassType.overline, fontSize: 8, color: theme.light.inkFaint },
  miniStat: { alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
  miniValue: { ...theme.glassType.label, fontSize: 16, fontWeight: '700', color: theme.light.ink },
  miniLabel: { ...theme.glassType.overline, fontSize: 8, color: theme.light.inkFaint },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barLabel: { ...theme.glassType.caption, fontSize: 12, width: 90 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.inkEdge(0.08), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barPct: { ...theme.glassType.label, fontSize: 11, width: 36, textAlign: 'right' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  milestoneDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inkEdge(0.06) },
  milestoneText: { ...theme.glassType.body, fontSize: 13, flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.accents.home.solid,
    borderRadius: glassRadius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  ctaText: { ...theme.glassType.label, fontSize: 12, color: '#FFF' },
});
