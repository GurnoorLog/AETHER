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
import { Stamp, SERIF, EditorialPressable } from '@/components/editorial';

const GREEN = '#3F5C3A';

const SUBJECT_IMAGES: Record<string, ImageSourcePropType> = {
  physics: require('../../assets/design/pysics.png'),
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

const DEFAULT_IMAGE = require('../../assets/design/pysics.png');

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
          <Stamp tone="forest" rotate={-2} style={{ marginBottom: 10, maxWidth: 220 }}>
            {session.title}
          </Stamp>
          <Stamp tone="ink" rotate={1.5} style={{ marginBottom: 12, opacity: 0.85 }}>
            {modules.length} modules
          </Stamp>
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
                    {lessonCount} lessons{isCompleted ? ' Â· Done' : ''}
                  </Text>
                </View>
                {isCurrent ? (
                  <Stamp tone="forest" rotate={2}>Current</Stamp>
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
  greetingLine: { fontFamily: SERIF, fontSize: 32, fontWeight: '700', color: '#2D3436', lineHeight: 38 },
  greetingName: { fontSize: 32, fontWeight: '700', color: GREEN, lineHeight: 38 },
  greetingSub: { fontSize: 16, fontWeight: '500', color: '#636E72', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 310, paddingHorizontal: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 20 },
  heroGreeting: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 4 },

  heroCard: { backgroundColor: 'rgba(253,251,247,0.96)', borderRadius: 22, borderTopLeftRadius: 22, borderTopRightRadius: 7, borderBottomLeftRadius: 24, borderBottomRightRadius: 8, borderWidth: 2, borderColor: '#2D3436', padding: 24, marginBottom: 28, boxShadow: '4px 4px 0 0 #2D3436' },
  heroBadge: { backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  heroBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '600', maxWidth: 200 },
  heroBadgeLight: { backgroundColor: '#F3EDE3', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  heroBadgeLightText: { color: '#999', fontSize: 11, fontWeight: '600' },
  heroTitle: { fontFamily: SERIF, fontSize: 23, fontWeight: '700', color: '#2D3436', lineHeight: 29, marginBottom: 16 },
  progressBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#EFEAE0', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: GREEN },
  progressPct: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436' },

  sectionLabel: { fontFamily: SERIF, fontSize: 12, fontWeight: '600', color: '#555E61', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: '47%', backgroundColor: '#FDFBF7', borderRadius: 22, borderTopLeftRadius: 22, borderTopRightRadius: 7, borderBottomLeftRadius: 24, borderBottomRightRadius: 8, borderWidth: 2, borderColor: '#2D3436', padding: 16, boxShadow: '3px 3px 0 0 #2D3436' },
  actionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontFamily: SERIF, fontSize: 10, fontWeight: '700', color: '#8A8478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  actionTitle: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: '#2D3436', marginBottom: 2 },
  actionDesc: { fontFamily: SERIF, fontSize: 12, color: '#555E61' },

  moduleCard: { backgroundColor: '#FDFBF7', borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 8, borderBottomLeftRadius: 22, borderBottomRightRadius: 7, borderWidth: 2, borderColor: '#2D3436', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: '3px 3px 0 0 #2D3436' },
  moduleLocked: { opacity: 0.5 },
  moduleIndex: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moduleNum: { fontFamily: SERIF, fontSize: 14, fontWeight: '700' },
  moduleText: { flex: 1, minWidth: 0 },
  moduleTitle: { fontFamily: SERIF, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  moduleMeta: { fontFamily: SERIF, fontSize: 11, color: '#8A8478' },
  currentPill: { backgroundColor: '#E8F0E5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  currentPillText: { fontSize: 10, fontWeight: '700', color: GREEN },

  emptyCard: { backgroundColor: '#FDFBF7', borderRadius: 22, borderTopLeftRadius: 22, borderTopRightRadius: 7, borderBottomLeftRadius: 24, borderBottomRightRadius: 8, borderWidth: 2, borderColor: '#2D3436', padding: 32, alignItems: 'center', boxShadow: '3px 3px 0 0 #2D3436' },
  emptyTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436', marginTop: 12 },
  emptyDesc: { fontFamily: SERIF, fontSize: 14, color: '#555E61', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  goHubBtn: { marginTop: 16, backgroundColor: GREEN, borderWidth: 2, borderColor: '#2D3436', borderRadius: 255, borderTopLeftRadius: 255, borderTopRightRadius: 15, borderBottomLeftRadius: 225, borderBottomRightRadius: 15, paddingHorizontal: 24, paddingVertical: 12, boxShadow: '3px 3px 0 0 #2D3436' },
  goHubBtnText: { color: '#FDFBF7', fontFamily: SERIF, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
});