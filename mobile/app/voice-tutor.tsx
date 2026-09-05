import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, requestRecordingPermissionsAsync, RecordingPresets } from 'expo-audio';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { streamChat, transcribeAudio, ttsToFile } from '@/lib/api';
import { getVoice } from '@/lib/prefs';
import { Icon } from '@/components/glass/Icon';
import { AudioLines, Bot, Mic, X } from '@/components/glass/icons';
import { MarkdownText } from '@/components/glass/MarkdownText';
import { SERIF, EDITORIAL } from '@/components/editorial';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

const GREEN = EDITORIAL.forest;
const GREEN_DEEP = '#2E4428';
const GREEN_WASH = '#E8F0E5';
const CARD_BORDER = EDITORIAL.ink;

export default function VoiceTutorPage() {
  const router = useRouter();
  const { conversationId: conversationIdParam } = useLocalSearchParams<{ conversationId?: string }>();
  const insets = useSafeAreaInsets();
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();

  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [userText, setUserText] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const replyPlayer = useAudioPlayer();
  const replyStatus = useAudioPlayerStatus(replyPlayer);
  const [replyUri, setReplyUri] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slow = phase === 'idle';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: slow ? 1800 : 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: slow ? 1800 : 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  useEffect(() => {
    if (!replyUri) return;
    replyPlayer.replace(replyUri);
  }, [replyUri, replyPlayer]);

  useEffect(() => {
    if (replyUri && replyStatus.isLoaded && !replyStatus.playing) replyPlayer.play();
  }, [replyUri, replyStatus, replyPlayer]);

  useEffect(
    () => () => {
      replyPlayer.pause();
    },
    [replyPlayer],
  );

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    if (conversationIdParam) {
      setConversationId(String(conversationIdParam));
      return String(conversationIdParam);
    }
    if (!authSession || !session) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: authSession.user.id, session_id: session.id, title: 'Voice Session' })
      .select('id')
      .single();
    if (data && !error) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  };

  const startListening = async () => {
    if (phase === 'thinking' || phase === 'speaking') return;
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('listening');
      setUserText(null);
      setAiText(null);
    } catch {
      setStatus('Could not start the microphone.');
    }
  };

  const stopListening = async () => {
    if (phase !== 'listening') return;
    setPhase('thinking');
    setStatus('Listening for a replyâ€¦');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setPhase('idle');
        setStatus('Nothing recorded â€” hold the orb to talk.');
        return;
      }
      const transcript = (await transcribeAudio(uri)).trim();
      if (!transcript) {
        setPhase('idle');
        setStatus('No speech heard â€” try again.');
        return;
      }
      setUserText(transcript);
      setStatus(null);

      const convId = await ensureConversation();
      if (!convId || !session) {
        setPhase('idle');
        setStatus('Select a session from the Hub first.');
        return;
      }

      let full = '';
      await streamChat(
        { message: transcript, conversation_id: convId, session_id: session.id },
        (e) => {
          if (e.type === 'status') setStatus(e.text);
          else if (e.type === 'chunk') {
            full += e.text;
            setAiText(full);
          } else if (e.type === 'error') throw new Error(e.error);
        },
      );
      const finalText = full.trim();
      if (finalText) {
        setPhase('speaking');
        const ttsUri = await ttsToFile(finalText, await getVoice());
        setReplyUri(ttsUri);
      } else {
        setPhase('idle');
      }
      setStatus(null);
    } catch (err) {
      setPhase('idle');
      setStatus(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Tutor</Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close voice tutor"
        >
          <Icon icon={X} size={18} color={EDITORIAL.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* The orb */}
        <View style={styles.orbWrap}>
          <Animated.View
            style={[
              styles.orbHalo,
              { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] }) },
            ]}
          />
          <Pressable
            onPressIn={startListening}
            onPressOut={stopListening}
            accessibilityRole="button"
            accessibilityLabel={phase === 'listening' ? 'Release to send voice note' : 'Hold to talk to Aether'}
            accessibilityState={{ busy: phase !== 'idle' }}
          >
            <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
              <View style={[styles.orb, phase === 'listening' && styles.orbActive]}>
                {phase === 'listening' ? (
                  <Icon icon={Mic} size={40} color={EDITORIAL.cream} strokeWidth={1.8} />
                ) : (
                  <Icon icon={AudioLines} size={40} color={EDITORIAL.cream} strokeWidth={1.8} />
                )}
              </View>
            </Animated.View>
          </Pressable>
        </View>

        {/* Status */}
        <View style={styles.statusWrap}>
          {phase === 'idle' && status ? (
            <Text style={styles.statusText}>{status}</Text>
          ) : (
            <Text style={styles.hintText}>
              {phase === 'idle' && 'Hold the orb, speak, then release.'}
              {phase === 'listening' && 'Listeningâ€¦ release to send.'}
              {phase === 'thinking' && (status ?? 'Thinkingâ€¦')}
              {phase === 'speaking' && 'Aether is explainingâ€¦'}
            </Text>
          )}
        </View>

        {/* Live transcript / reply */}
        {(userText || aiText) ? (
          <View style={styles.transcript}>
            {userText ? (
              <View style={styles.card}>
                <View style={styles.transcriptHeader}>
                  <View style={styles.badgeUser}>
                    <Icon icon={Mic} size={13} color={EDITORIAL.ink} strokeWidth={2} />
                  </View>
                  <Text style={styles.transcriptLabel}>You</Text>
                </View>
                <Text style={styles.userText}>{userText}</Text>
              </View>
            ) : null}
            {aiText ? (
              <View style={styles.card}>
                <View style={styles.transcriptHeader}>
                  <View style={styles.badgeAi}>
                    <Icon icon={Bot} size={13} color="#FFFFFF" strokeWidth={2} />
                  </View>
                  <Text style={styles.transcriptLabel}>Aether</Text>
                </View>
                <MarkdownText content={aiText} color={EDITORIAL.ink} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Aether answers out loud, hands-free â€” just like the voice session on the website.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: EDITORIAL.cream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: '700',
    color: EDITORIAL.ink,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    backgroundColor: EDITORIAL.cream,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  closeButtonPressed: { backgroundColor: GREEN_WASH },
  body: { alignItems: 'center', paddingHorizontal: 24, gap: 28 },
  orbWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  orbHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: GREEN_WASH,
  },
  orb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    shadowColor: EDITORIAL.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  orbActive: { backgroundColor: GREEN_DEEP },
  statusWrap: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  hintText: {
    fontFamily: SERIF,
    color: GREEN,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusText: {
    fontFamily: SERIF,
    color: EDITORIAL.inkMuted,
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  transcript: { alignSelf: 'stretch', gap: 12 },
  card: {
    padding: 20,
    backgroundColor: EDITORIAL.cream,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badgeUser: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_WASH,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
  },
  badgeAi: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
  },
  transcriptLabel: { fontFamily: SERIF, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: EDITORIAL.inkMuted, textTransform: 'uppercase' },
  userText: { fontFamily: SERIF, fontSize: 15, lineHeight: 22, color: EDITORIAL.ink },
  placeholder: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 8 },
  placeholderText: { fontFamily: SERIF, textAlign: 'center', color: EDITORIAL.inkMuted, fontSize: 14, lineHeight: 21 },
});