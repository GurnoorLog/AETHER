import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import type { RoadmapModule } from '@/lib/types';
import { Icon } from '@/components/glass/Icon';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  MessageSquareText,
  Target,
  Trophy,
} from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';

const GREEN = '#6B8E61';

const SUBJECT_IMAGES: Record<string, ImageSourcePropType> = {
  physics: require('../../assets/design/physics.jpg'),
  maths: require('../../assets/design/maths.jpg'),
  math: require('../../assets/design/maths.jpg'),
  mathematics: require('../../assets/design/maths.jpg'),
  biology: require('../../assets/design/biology.jpg'),
  chemistry: require('../../assets/design/chemistry.jpg'),
  'computer science': require('../../assets/design/cs.jpg'),
  cs: require('../../assets/design/cs.jpg'),
  history: require('../../assets/design/history.jpg'),
  literature: require('../../assets/design/literature.jpg'),
  english: require('../../assets/design/literature.jpg'),
};

const DEFAULT_IMAGE = require('../../assets/design/physics.jpg');

function getSubjectImage(subject?: string | null): ImageSourcePropType {
  if (!subject) return DEFAULT_IMAGE;
  const key = subject.toLowerCase().trim();
  return SUBJECT_IMAGES[key] || DEFAULT_IMAGE;
}

export default function HomeTab() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('session_roadmap_modules')
      .select('id, session_id, user_id, module_index, title, description, status, lessons, learning_objectives, key_concepts, completed_at, created_at')
      .eq('session_id', session.id)
      .eq('user_id', authSession.user.id)
      .order('module_index', { ascending: true });
    if (data) {
      setModules((data as RoadmapModule[]).map((m) => ({
        ...m,
        lessons: typeof m.lessons === 'string' ? JSON.parse(m.lessons) : (m.lessons || []),
      })));
    }
    setLoading(false);
  }, [authSession, session]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const currentModule = modules.find((m) => m.status === 'current');
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (!session) {
    return (
      <View style={styles.root}>
        <Image source={DEFAULT_IMAGE} style={styles.heroImage} />
        <View style={styles.heroOverlay} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={{ height: 120 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Image source={getSubjectImage(session.subject)} style={styles.heroImage} />
      <View style={styles.heroOverlay} />
      <View style={styles.imageContent} pointerEvents="none">
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.greetingLine}>Good morning,</Text>
            <Text style={styles.greetingName}>{session.subject || 'Student'}</Text>
            <Text style={styles.greetingSub}>Ready to learn something amazing today?</Text>
          </View>
        </View>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText} numberOfLines={1}>{session.title}</Text>
          </View>
          <View style={styles.heroBadgeLight}>
            <Text style={styles.heroBadgeLightText}>{modules.length} Modules</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {currentModule
              ? `Continue "${currentModule.title}"`
              : completedCount === modules.length && modules.length > 0
                ? 'All Complete!'
                : `Welcome to ${session.subject || 'your session'}`}
          </Text>
          <View style={styles.progressBlock}>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {currentModule ? (
            <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/tutor')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F0E5' }]}>
                <Icon icon={MessageSquareText} size={20} color={GREEN} />
              </View>
              <Text style={styles.actionLabel}>CONTINUE</Text>
              <Text style={styles.actionTitle} numberOfLines={1}>{currentModule.title}</Text>
              <Text style={styles.actionDesc}>Resume this module</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/tutor')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F0E5' }]}>
              <Icon icon={MessageSquareText} size={20} color={GREEN} />
            </View>
            <Text style={styles.actionLabel}>TUTOR</Text>
            <Text style={styles.actionTitle}>Chat with Aether</Text>
            <Text style={styles.actionDesc}>Ask anything about this subject</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/progress')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8E8' }]}>
              <Icon icon={Target} size={20} color="#C05050" />
            </View>
            <Text style={styles.actionLabel}>PROGRESS</Text>
            <Text style={styles.actionTitle}>Check In</Text>
            <Text style={styles.actionDesc}>Mastery & milestones</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/sessions')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8EEF3' }]}>
              <Icon icon={Trophy} size={20} color="#5080B0" />
            </View>
            <Text style={styles.actionLabel}>QUIZZES</Text>
            <Text style={styles.actionTitle}>Test Knowledge</Text>
            <Text style={styles.actionDesc}>Quiz on any module</Text>
          </Pressable>
        </View>

        {/* Module overview */}
        <Text style={styles.sectionLabel}>Modules</Text>
        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Loading your roadmap...</Text>
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>No modules yet. Create a new session from the Hub.</Text>
          </View>
        ) : (
          modules.map((mod) => {
            const isCompleted = mod.status === 'completed';
            const isCurrent = mod.status === 'current';
            const lessonCount = Array.isArray(mod.lessons) ? mod.lessons.length : 0;
            return (
              <Pressable
                key={mod.id}
                onPress={() => isCurrent ? router.push('/(tabs)/tutor') : undefined}
                style={[styles.moduleCard, !isCompleted && !isCurrent && styles.moduleLocked]}
              >
                <View style={[styles.moduleIndex, { backgroundColor: isCompleted ? '#E8F0E5' : isCurrent ? '#F3EDE3' : '#F5F5F5' }]}>
                  {isCompleted ? (
                    <Icon icon={Check} size={15} color={GREEN} strokeWidth={2.5} />
                  ) : (
                    <Text style={[styles.moduleNum, { color: isCurrent ? GREEN : '#CCC' }]}>{mod.module_index + 1}</Text>
                  )}
                </View>
                <View style={styles.moduleText}>
                  <Text style={[styles.moduleTitle, { color: isCurrent ? '#333' : isCompleted ? '#999' : '#CCC' }]} numberOfLines={1}>
                    {mod.title}
                  </Text>
                  <Text style={styles.moduleMeta}>
                    {lessonCount} lessons{isCompleted ? ' · Done' : ''}
                  </Text>
                </View>
                {isCurrent ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentPillText}>CURRENT</Text>
                  </View>
                ) : null}
                {isCurrent ? <Icon icon={ArrowRight} size={15} color="#CCC" /> : null}
              </Pressable>
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
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, width: '100%', resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  imageContent: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, paddingTop: 56, paddingHorizontal: 24, zIndex: 3 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: { flex: 1 },
  greetingLine: { fontSize: 32, fontWeight: '700', color: '#2D3436', lineHeight: 38 },
  greetingName: { fontSize: 32, fontWeight: '700', color: GREEN, lineHeight: 38 },
  greetingSub: { fontSize: 16, fontWeight: '500', color: '#636E72', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 310, paddingHorizontal: 24 },
  heroHeader: { marginBottom: 20 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 20 },
  heroGreeting: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 4 },

  // Hero card
  heroCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  heroBadge: { backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  heroBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '600', maxWidth: 200 },
  heroBadgeLight: { backgroundColor: '#F3EDE3', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  heroBadgeLightText: { color: '#999', fontSize: 11, fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#333', lineHeight: 28, marginBottom: 16 },
  progressBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: GREEN },
  progressPct: { fontSize: 16, fontWeight: '700', color: '#333' },

  // Section
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Quick actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  actionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 2 },
  actionDesc: { fontSize: 12, color: '#999' },

  // Modules
  moduleCard: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleLocked: { opacity: 0.5 },
  moduleIndex: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moduleNum: { fontSize: 14, fontWeight: '700' },
  moduleText: { flex: 1, minWidth: 0 },
  moduleTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  moduleMeta: { fontSize: 11, color: '#BBB' },
  currentPill: { backgroundColor: '#E8F0E5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  currentPillText: { fontSize: 10, fontWeight: '700', color: GREEN },

  // Empty
  emptyCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3EDE3', padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  goHubBtn: { marginTop: 16, backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 },
  goHubBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
