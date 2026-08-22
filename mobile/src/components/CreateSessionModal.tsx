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

const GREEN = '#6B8E61';

const PRESETS = [
  { label: 'Mathematics', icon: Brain },
  { label: 'Physics', icon: Rocket },
  { label: 'Biology', icon: BookOpen },
  { label: 'Chemistry', icon: GraduationCap },
  { label: 'History', icon: BookOpen },
  { label: 'Literature', icon: BookOpen },
];

export function CreateSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    onClose();
  };

  const startLearning = () => {
    if (!created) return close();
    setSession({ id: created.sessionId, slug: created.slug, title: created.title, subject: subject });
    close();
    router.replace('/(tabs)');
  };

  const handleCreate = async () => {
    if (!subject.trim() || creating) return;
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
              <Icon icon={X} size={22} color="#999" />
            </Pressable>
          </View>

          {created ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.readyRow}>
                <View style={styles.readyIcon}>
                  <Icon icon={Sparkles} size={22} color={GREEN} />
                </View>
                <View style={styles.readyText}>
                  <Text style={styles.readyTitle}>{created.title}</Text>
                  <Text style={styles.readySubtitle}>Your personalized learning path is ready.</Text>
                </View>
              </View>
              <Pressable style={styles.createBtn} onPress={startLearning}>
                <Icon icon={Rocket} size={18} color="#FFF" />
                <Text style={styles.createBtnText}>Start Learning</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>SUBJECT</Text>
              <View style={styles.presetGrid}>
                {PRESETS.map((p) => (
                  <Pressable
                    key={p.label}
                    onPress={() => setSubject(p.label)}
                    style={[styles.preset, subject === p.label && styles.presetActive]}
                  >
                    <Icon icon={p.icon} size={20} color={subject === p.label ? GREEN : '#999'} />
                    <Text style={[styles.presetLabel, subject === p.label && styles.presetLabelActive]} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Or type any topic you want to learn..."
                placeholderTextColor="#CCC"
                value={subject}
                onChangeText={setSubject}
                autoCapitalize="sentences"
              />

              <Text style={styles.label}>WHAT DO YOU WANT TO LEARN? (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.objectives]}
                placeholder="e.g. I want to understand derivatives and integrals for my exam next week..."
                placeholderTextColor="#CCC"
                value={objectives}
                onChangeText={setObjectives}
                multiline
                textAlignVertical="top"
              />

              {error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.createBtn, (!subject.trim() || creating) && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!subject.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Icon icon={GraduationCap} size={18} color="#FFF" />
                )}
                <Text style={styles.createBtnText}>
                  {creating ? 'Generating your roadmap...' : 'Create Session'}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#FDFBF7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    paddingTop: 24,
    paddingBottom: 40,
    overflow: 'hidden',
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
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  content: { paddingHorizontal: 24, gap: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { width: '30.8%', backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#F3EDE3', paddingVertical: 14, alignItems: 'center', gap: 6 },
  presetActive: { borderColor: GREEN, backgroundColor: '#F0F5EE' },
  presetLabel: { fontSize: 11, fontWeight: '600', color: '#999' },
  presetLabelActive: { color: GREEN },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#F3EDE3',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#333',
    fontSize: 15,
  },
  objectives: { minHeight: 90, paddingTop: 14 },
  errorCard: { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FDD' },
  errorText: { fontSize: 14, color: '#C05050', lineHeight: 20 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 16 },
  readyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  readyText: { flex: 1, gap: 4 },
  readyTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  readySubtitle: { fontSize: 14, color: '#999' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, height: 56, borderRadius: 28, shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
