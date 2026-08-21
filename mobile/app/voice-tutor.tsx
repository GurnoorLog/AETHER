import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, requestRecordingPermissionsAsync, RecordingPresets } from 'expo-audio';
import { AudioLines, Bot, Mic, X } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { streamChat, transcribeAudio, ttsToFile } from '@/lib/api';
import { getVoice } from '@/lib/prefs';
import { useTheme, glassRadius, spacing, type GlassTheme } from '@/theme';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { MarkdownText } from '@/components/glass/MarkdownText';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceTutorPage() {
  const router = useRouter();
  const { conversationId: conversationIdParam } = useLocalSearchParams<{ conversationId?: string }>();
  const insets = useSafeAreaInsets();
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

  // Orb pulse — always gently breathing; fast-pulse while listening/speaking.
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

  // Stop any speaking when the page unmounts.
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
    setStatus('Listening for a reply…');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setPhase('idle');
        setStatus('Nothing recorded — hold the orb to talk.');
        return;
      }
      const transcript = (await transcribeAudio(uri)).trim();
      if (!transcript) {
        setPhase('idle');
        setStatus('No speech heard — try again.');
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
    <GlassScreen accent="voice">
      <View style={styles.header}>
        <Text style={styles.title}>Voice Tutor</Text>
        <GlassIconButton icon={X} onPress={() => router.back()} accent="voice" size={40} accessibilityLabel="Close voice tutor" />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
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
              <LinearGradient
                colors={phase === 'listening' ? ['#7C60E4', '#4C34B8'] : ['#E7D8FB', '#C6B3F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orb}
              >
                {phase === 'listening' ? <MicIcon /> : <AudioLinesIcon />}
              </LinearGradient>
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
              {phase === 'listening' && 'Listening… release to send.'}
              {phase === 'thinking' && (status ?? 'Thinking…')}
              {phase === 'speaking' && 'Aether is explaining…'}
            </Text>
          )}
        </View>

        {/* Live transcript / reply */}
        {(userText || aiText) ? (
          <View style={styles.transcript}>
            {userText ? (
              <GlassSurface radius={glassRadius.squircle} intensity="regular" fill={theme.glass.fillStrong} bordered={false} style={styles.userCard}>
                <View style={styles.transcriptHeader}>
                  <View style={[styles.transcriptBadge, { backgroundColor: theme.accents.voice.wash }]}>
                    <MicIcon size={13} color={theme.accents.voice.solid} />
                  </View>
                  <Text style={styles.transcriptLabel}>You</Text>
                </View>
                <Text style={styles.userText}>{userText}</Text>
              </GlassSurface>
            ) : null}
            {aiText ? (
              <GlassSurface radius={glassRadius.squircle} intensity="regular" fill={theme.glass.fill} bordered={false} style={styles.aiCard}>
                <View style={styles.transcriptHeader}>
                  <View style={[styles.transcriptBadge, { backgroundColor: theme.accents.voice.solid }]}>
                    <BotIcon size={13} color="#FFF" />
                  </View>
                  <Text style={styles.transcriptLabel}>Aether</Text>
                </View>
                <MarkdownText content={aiText} color={theme.light.inkSoft} />
              </GlassSurface>
            ) : null}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Aether answers out loud, hands-free — just like the voice session on the website.</Text>
          </View>
        )}
      </ScrollView>
    </GlassScreen>
  );
}

// Tiny local icon components so the page doesn't pull the whole icon set.
function MicIcon({ size = 40, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return <Mic size={size} color={color} strokeWidth={1.8} />;
}
function AudioLinesIcon({ size = 40, color = '#7C60E4' }: { size?: number; color?: string }) {
  return <AudioLines size={size} color={color} strokeWidth={1.8} />;
}
function BotIcon({ size = 13, color = '#FFF' }: { size?: number; color?: string }) {
  return <Bot size={size} color={color} strokeWidth={2} />;
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...theme.glassType.title,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: -0.8,
    color: theme.light.ink,
  },
  body: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.lg },
  orbWrap: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  orbHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.accents.voice.wash,
  },
  orb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#4C34B8',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  statusWrap: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  hintText: {
    ...theme.glassType.overline,
    color: theme.accents.voice.solid,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 2,
  },
  statusText: {
    ...theme.glassType.caption,
    color: theme.light.inkMuted,
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  transcript: { alignSelf: 'stretch', gap: spacing.md },
  userCard: { padding: spacing.lg },
  aiCard: { padding: spacing.lg },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  transcriptBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptLabel: { ...theme.glassType.overline, color: theme.light.inkMuted },
  userText: { fontSize: 15, lineHeight: 22, color: theme.light.ink },
  placeholder: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  placeholderText: { ...theme.glassType.body, textAlign: 'center', color: theme.light.inkFaint, fontSize: 14, lineHeight: 21 },
});
