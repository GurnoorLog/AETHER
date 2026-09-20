import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { createSession, type CreatedSession } from '@/lib/api';
import { getEntitlementTier } from '@/lib/revenuecat';
import { useActiveSession } from '@/lib/activeSession';
import { Icon } from '@/components/glass/Icon';
import { GraduationCap, BookOpen, Brain, Rocket, Sparkles, X } from '@/components/glass/icons';
import {
  EditorialCard,
  EditorialButton,
  EditorialInput,
  Stamp,
  Kicker,
  RuleRough,
  SERIF,
  EDITORIAL,
} from '@/components/editorial';

const PRESETS = [
  { label: 'Mathematics', icon: Brain },
  { label: 'Physics', icon: Rocket },
  { label: 'Biology', icon: BookOpen },
  { label: 'Chemistry', icon: GraduationCap },
  { label: 'History', icon: BookOpen },
  { label: 'Literature', icon: BookOpen },
];

export function CreateSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [objectives, setObjectives] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const { setSession } = useActiveSession();

  const close = () => {
    setCreated(null);
    setError('');
    setSubject('');
    setObjectives('');
    setStep(0);
    onClose();
  };

  const next = () => {
    if (!subject.trim()) return;
    setError('');
    setStep(1);
  };

  const startLearning = () => {
    if (!created) return close();
    setSession({ id: created.sessionId, slug: created.slug, title: created.title, subject: subject });
    close();
    router.replace('/(tabs)');
  };

  const handleCreate = async () => {
    if (!subject.trim() || !objectives.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const tier = await getEntitlementTier();
      if (tier === 'free') {
        const { count } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if ((count ?? 0) >= 1) {
          setError('Free plan includes 1 active session. Upgrade to Pro for up to 10.');
          setCreating(false);
          return;
        }
      }
      const result = await createSession({ subject: subject.trim(), objectives });
      setCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally { setCreating(false); }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <Image source={require('../../assets/design/sakura_leaves.png')} style={styles.sakuraImage} resizeMode="contain" />
          <View style={styles.header}>
            <Text style={styles.title}>{created ? 'Roadmap Ready' : 'New Study Session'}</Text>
            <Pressable onPress={close} hitSlop={8}>
              <Icon icon={X} size={22} color={EDITORIAL.inkMuted} />
            </Pressable>
          </View>

          {created ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.readyRow}>
                <View style={styles.readyIcon}>
                  <Icon icon={Sparkles} size={22} color={EDITORIAL.forest} />
                </View>
                <View style={styles.readyText}>
                  <Text style={styles.readyTitle}>{created.title}</Text>
                  <Text style={styles.readySubtitle}>Your personalized learning path is ready.</Text>
                </View>
              </View>
              <EditorialButton tone="forest" onPress={startLearning}>
                <View style={styles.createBtnInner}>
                  <Icon icon={Rocket} size={18} color={EDITORIAL.cream} />
                  <Text style={styles.createBtnText}>Start Learning</Text>
                </View>
              </EditorialButton>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {step === 0 ? (
                <>
                  <Kicker>STEP 1 OF 2</Kicker>
                  <RuleRough />
                  <View style={styles.presetGrid}>
                    {PRESETS.map((p) => {
                      const active = subject === p.label;
                      return (
                        <Pressable
                          key={p.label}
                          onPress={() => setSubject(p.label)}
                          style={[
                            styles.preset,
                            active && styles.presetActive,
                          ]}
                        >
                          <Icon icon={p.icon} size={20} color={active ? EDITORIAL.cream : EDITORIAL.inkMuted} />
                          <Text style={[styles.presetLabel, active && styles.presetLabelActive]} numberOfLines={1}>
                            {p.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <EditorialInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Or type any subject you want to learn..."
                    style={styles.inputCustom}
                  />

                  {error ? (
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <EditorialButton
                    tone={!subject.trim() ? 'disabled' : 'forest'}
                    onPress={next}
                    style={!subject.trim() ? { opacity: 0.5 } : undefined}
                  >
                    <View style={styles.createBtnInner}>
                      <Icon icon={BookOpen} size={18} color={EDITORIAL.cream} />
                      <Text style={styles.createBtnText}>Select Subject</Text>
                    </View>
                  </EditorialButton>
                </>
              ) : (
                <>
                  <Pressable onPress={() => { setError(''); setStep(0); }} style={styles.backRow} hitSlop={8}>
                    <Icon icon={X} size={16} color={EDITORIAL.inkMuted} />
                    <Text style={styles.backText}>Change subject</Text>
                  </Pressable>
                  <Kicker>SUBJECT: {subject.toUpperCase()}</Kicker>
                  <RuleRough />
                  <Kicker>STEP 2 OF 2</Kicker>
                  <RuleRough />
                  <EditorialInput
                    value={objectives}
                    onChangeText={setObjectives}
                    placeholder="What do you want to learn? e.g. I want to understand derivatives and integrals for my exam next week..."
                    style={[styles.inputCustom, styles.objectives]}
                  />

                  {error ? (
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <EditorialButton
                    tone={!subject.trim() || !objectives.trim() || creating ? 'disabled' : 'forest'}
                    onPress={handleCreate}
                    style={(!subject.trim() || !objectives.trim() || creating) ? { opacity: 0.5 } : undefined}
                  >
                    <View style={styles.createBtnInner}>
                      {creating ? (
                        <ActivityIndicator color={EDITORIAL.cream} size="small" />
                      ) : (
                        <Icon icon={GraduationCap} size={18} color={EDITORIAL.cream} />
                      )}
                      <Text style={styles.createBtnText}>
                        {creating ? 'Generating your roadmap...' : 'Create my roadmap'}
                      </Text>
                    </View>
                  </EditorialButton>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const SHEET_SHADOW: import('react-native').ViewStyle = {
  boxShadow: '4px 4px 0 0 #2D3436',
};

const CARD_SHADOW: import('react-native').ViewStyle = {
  boxShadow: '3px 3px 0 0 #2D3436',
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: EDITORIAL.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    maxHeight: '88%',
    paddingTop: 24,
    paddingBottom: 40,
    overflow: 'hidden',
    ...SHEET_SHADOW,
  },
  sakuraImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
    zIndex: 1,
  },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: EDITORIAL.ink },
  backRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: 4 },
  backText: { fontFamily: SERIF, fontSize: 13, fontWeight: '600', color: EDITORIAL.inkMuted, textDecorationLine: 'underline' },
  content: { paddingHorizontal: 24, gap: 12 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    width: '30.8%',
    backgroundColor: EDITORIAL.cream,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    ...CARD_SHADOW,
  },
  presetActive: { backgroundColor: EDITORIAL.forest, borderColor: EDITORIAL.ink },
  presetLabel: { fontFamily: SERIF, fontSize: 11, fontWeight: '600', color: EDITORIAL.inkMuted },
  presetLabelActive: { color: EDITORIAL.cream },
  inputCustom: {},
  objectives: { minHeight: 90, paddingTop: 14, textAlignVertical: 'top' },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    padding: 16,
    borderWidth: 2,
    borderColor: '#C05050',
  },
  errorText: { fontFamily: SERIF, fontSize: 14, color: '#C05050', lineHeight: 20 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 16 },
  readyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: EDITORIAL.forest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
  },
  readyText: { flex: 1, gap: 4 },
  readyTitle: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: EDITORIAL.ink },
  readySubtitle: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted },
  createBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createBtnText: { color: EDITORIAL.cream, fontFamily: SERIF, fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.3 },
});
