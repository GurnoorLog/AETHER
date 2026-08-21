import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, requestRecordingPermissionsAsync, RecordingPresets } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { streamChat, transcribeAudio, ttsToFile, uploadKnowledgeImage } from '@/lib/api';
import type { ChatMessage as DBChatMessage, Conversation } from '@/lib/types';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { MarkdownText } from '@/components/glass/MarkdownText';
import {
  AudioLines,
  Bot,
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Mic,
  Plus,
  Send,
  Trash2,
  UserRound,
  Volume2,
} from '@/components/glass/icons';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
}

function generateTitle(text: string): string {
  const cleaned = text.replace(/\n/g, ' ').trim();
  return cleaned.length <= 50 ? cleaned : cleaned.slice(0, 50).trim() + '...';
}

const MessageBubble = memo(function MessageBubble({
  m,
  theme,
  styles,
}: {
  m: LocalMessage;
  theme: GlassTheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.bubbleRow, m.role === 'user' ? styles.userRow : styles.botRow]}>
      {m.role === 'assistant' ? (
        <View style={[styles.avatar, { backgroundColor: theme.accents.voice.wash }]}>
          <Icon icon={Bot} size={16} color={theme.accents.voice.solid} />
        </View>
      ) : null}
      {m.role === 'user' ? (
        <GlassSurface
          radius={glassRadius.lozenge}
          intensity="regular"
          fill={theme.glass.fillStrong}
          tintColor={theme.accents.voice.wash}
          bordered={false}
          style={[styles.bubble, styles.userBubble]}
        >
          <Text style={[styles.messageText, { color: theme.light.ink }]}>{m.content}</Text>
        </GlassSurface>
      ) : m.content ? (
        <GlassSurface
          radius={glassRadius.squircle}
          intensity="regular"
          fill={theme.glass.fill}
          bordered={false}
          style={[styles.bubble, styles.botBubble]}
        >
          <MarkdownText content={m.content} color={theme.light.inkSoft} />
        </GlassSurface>
      ) : m.streaming ? (
        <GlassSurface
          radius={glassRadius.squircle}
          intensity="regular"
          fill={theme.glass.fill}
          bordered={false}
          style={[styles.bubble, styles.botBubble]}
        >
          <View style={styles.typing}>
            <ActivityIndicator color={theme.accents.voice.solid} size="small" />
          </View>
        </GlassSurface>
      ) : null}
    </View>
  );
});

export default function TutorTab() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const router = useRouter();
  const { conversation: pendingConversation } = useLocalSearchParams<{ conversation?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [attaching, setAttaching] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const replyPlayer = useAudioPlayer();
  const replyStatus = useAudioPlayerStatus(replyPlayer);
  const [replyUri, setReplyUri] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!authSession || !session) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('conversations')
      .select('id, user_id, session_id, title, created_at, updated_at')
      .eq('user_id', authSession.user.id)
      .eq('session_id', session.id)
      .order('created_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
    setLoading(false);
  }, [authSession, session]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) setMessages((data as DBChatMessage[]).map((m) => ({ id: m.id, role: m.role, content: m.content })));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, focused]);

  useEffect(() => {
    if (pendingConversation) {
      const convId = String(pendingConversation);
      router.setParams({ conversation: '' });
      setActiveId(convId);
    }
  }, [pendingConversation, router]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeId);
  }, [activeId, focused, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, status]);

  const createConversation = async () => {
    if (!authSession || !session) return;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: authSession.user.id, session_id: session.id, title: 'New Chat' })
      .select('id, user_id, session_id, title, created_at, updated_at')
      .single();
    if (data && !error) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveId(data.id);
      setMessages([]);
    }
  };

  const attachImage = async () => {
    if (!session) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setAttaching(true);
    setStatus(`Uploading "${asset.fileName || 'image'}"...`);
    try {
      const mime = asset.mimeType || 'image/jpeg';
      await uploadKnowledgeImage(asset.uri, asset.fileName || `image-${Date.now()}.jpg`, mime, session.id);
      setStatus('Image added to your knowledge base.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAttaching(false);
    }
  };

  const deleteConversation = (convId: string) => {
    Alert.alert('Delete conversation', 'Delete this chat and all its messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('chat_messages').delete().eq('conversation_id', convId);
          await supabase.from('conversations').delete().eq('id', convId);
          setConversations((prev) => prev.filter((c) => c.id !== convId));
          if (activeId === convId) {
            setActiveId(null);
            setMessages([]);
          }
        },
      },
    ]);
  };

  const sendText = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending || !activeId || !session) return;
    const isFirst = messages.length === 0;

    setInput('');
    setSending(true);
    setStatus(null);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content: clean }]);

    if (isFirst) {
      const title = generateTitle(clean);
      await supabase.from('conversations').update({ title }).eq('id', activeId);
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, title } : c)));
    }

    let fullText = '';
    setMessages((prev) => [...prev, { id: '__streaming__', role: 'assistant', content: '', streaming: true }]);

    try {
      await streamChat(
        { message: clean, conversation_id: activeId, session_id: session.id },
        (e) => {
          if (e.type === 'status') {
            setStatus(e.text);
          } else if (e.type === 'chunk') {
            fullText += e.text;
            setStatus(null);
            setMessages((prev) =>
              prev.map((m) => (m.id === '__streaming__' ? { ...m, content: fullText } : m)),
            );
          } else if (e.type === 'error') {
            throw new Error(e.error);
          }
        },
      );
      if (speaking && fullText.trim()) speak(fullText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed';
      setMessages((prev) => prev.filter((m) => m.id !== '__streaming__'));
      setStatus(msg);
    } finally {
      setSending(false);
      setMessages((prev) => prev.map((m) => (m.id === '__streaming__' ? { ...m, streaming: false } : m)));
    }
  };

  const sendMessage = () => sendText(input);

  const speak = async (text: string) => {
    try {
      const uri = await ttsToFile(text);
      setReplyUri(uri);
    } catch {
      // TTS failure is non-fatal — text reply is already shown.
    }
  };

  // Stable player: load the newest TTS uri, then play once it's ready.
  useEffect(() => {
    if (!replyUri) return;
    replyPlayer.replace(replyUri);
  }, [replyUri, replyPlayer]);

  useEffect(() => {
    if (replyUri && replyStatus.isLoaded && !replyStatus.playing) replyPlayer.play();
  }, [replyUri, replyStatus, replyPlayer]);

  const startListening = async () => {
    if (sending || recording) return;
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone access needed', 'Enable mic permission to use the voice tutor.');
      return;
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      setStatus('Listening…');
    } catch {
      Alert.alert('Recording failed', 'Could not start the microphone.');
    }
  };

  const stopListening = async () => {
    if (!recording) return;
    setRecording(false);
    setStatus('Transcribing…');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setStatus('Nothing recorded');
        return;
      }
      const transcript = await transcribeAudio(uri);
      if (transcript.trim()) {
        setStatus(null);
        sendText(transcript);
      } else {
        setStatus('No speech heard — try again');
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Transcription failed');
    }
  };

  useEffect(() => {
    if (!activeId) return;
    replyPlayer.pause();
    setReplyUri(null);
  }, [activeId, replyPlayer]);

  useEffect(
    () => () => {
      replyPlayer.pause();
    },
    [replyPlayer],
  );

  const needsSession = !session;

  return (
    <GlassScreen accent="voice" edges={['left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.header, styles.column]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{activeId ? 'Chat' : 'Tutor'}</Text>
            <Text style={styles.subtitle}>{session?.title ?? 'No session selected'}</Text>
          </View>
          <View style={styles.headerActions}>
            {activeId ? (
              <>
                <GlassIconButton
                  icon={AudioLines}
                  onPress={() => router.push({ pathname: '/voice-tutor', params: { conversationId: activeId } })}
                  accent="voice"
                  size={40}
                  accessibilityLabel="Open voice tutor"
                />
                <GlassIconButton icon={ChevronLeft} onPress={() => setActiveId(null)} accent="voice" size={40} accessibilityLabel="Back to conversations" />
              </>
            ) : null}
            <GlassIconButton
              icon={Volume2}
              onPress={() => setSpeaking((s) => !s)}
              active={speaking}
              accent="voice"
              size={40}
              accessibilityLabel={speaking ? 'Mute voice replies' : 'Enable voice replies'}
            />
            <GlassIconButton icon={Plus} onPress={createConversation} accessibilityLabel="New chat" accent="voice" />
          </View>
        </View>

        {needsSession ? (
          <View style={[styles.center, styles.column]}>
            <GlassCard>
              <View style={styles.noSession}>
                <Icon icon={MessageSquareText} size={28} color={theme.accents.voice.solid} />
                <Text style={theme.glassType.subtitle}>Select a session first</Text>
                <Text style={theme.glassType.body}>Pick a session from the Hub, then come back to chat with Aether.</Text>
              </View>
            </GlassCard>
          </View>
        ) : !activeId ? (
          /* Conversation list — mirror of the web chat page. Tap to open, trash to delete. */
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.listContent, styles.column]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.listOverline}>Recent Conversations</Text>

            {loading ? (
              <ActivityIndicator color={theme.accents.voice.solid} style={styles.chipLoader} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyList}>
                <Icon icon={Bot} size={40} color={theme.light.inkFaint} />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptyDesc}>Ask Aether anything about {session.subject || 'this subject'}.</Text>
                <Pressable onPress={createConversation} style={styles.newChatBtn} accessibilityRole="button">
                  <Icon icon={Plus} size={16} color="#FFF" strokeWidth={2} />
                  <Text style={styles.newChatLabel}>New Chat</Text>
                </Pressable>
              </View>
            ) : (
              conversations.map((c) => (
                <View key={c.id} style={styles.convRow}>
                  <Pressable
                    onPress={() => setActiveId(c.id)}
                    style={({ pressed }) => [styles.convCard, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.convIcon, { backgroundColor: theme.accents.voice.wash }]}>
                      <Icon icon={MessageSquareText} size={18} color={theme.accents.voice.solid} />
                    </View>
                    <View style={styles.convText}>
                      <Text style={styles.convTitle} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <Text style={styles.convDate}>
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Icon icon={ChevronRight} size={16} color={theme.light.inkFaint} />
                  </Pressable>
                  <GlassIconButton icon={Trash2} onPress={() => deleteConversation(c.id)} accent="data" size={34} accessibilityLabel="Delete conversation" />
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[styles.messages, styles.column]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && !sending ? (
                <View style={[styles.center, styles.column]}>
                  <Icon icon={Bot} size={44} color={theme.light.inkFaint} />
                  <Text style={styles.emptyTitle}>Ask anything about {session.subject || 'this subject'}</Text>
                  <Text style={styles.emptyDesc}>Aether searches your documents and answers with citations.</Text>
                </View>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} m={m} theme={theme} styles={styles} />)
              )}
              {status ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={theme.accents.voice.solid} size="small" />
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Composer */}
            <View style={[styles.composerWrap, styles.column, { paddingBottom: insets.bottom + 74 }]}>
              <GlassSurface radius={glassRadius.pill} intensity="thick" fill={theme.glass.fillStrong} bordered={false} style={styles.composer}>
                <Pressable
                  onPress={attachImage}
                  disabled={sending || attaching}
                  accessibilityRole="button"
                  accessibilityLabel="Add an image to your knowledge base"
                  style={({ pressed }) => [
                    styles.attachBtn,
                    pressed && !sending && { backgroundColor: 'rgba(124,96,228,0.2)' },
                  ]}
                >
                  {attaching ? <ActivityIndicator color={theme.accents.voice.solid} size="small" /> : <Icon icon={Camera} size={18} color={theme.accents.voice.solid} strokeWidth={2} />}
                </Pressable>
                <Pressable
                  onPressIn={startListening}
                  onPressOut={stopListening}
                  disabled={sending}
                  accessibilityRole="button"
                  accessibilityLabel={recording ? 'Release to send voice note' : 'Hold to talk'}
                  accessibilityState={{ disabled: sending, busy: recording }}
                  style={({ pressed }) => [
                    styles.micBtn,
                    { backgroundColor: recording ? theme.accents.data.solid : pressed ? 'rgba(124,96,228,0.2)' : 'rgba(124,96,228,0.14)' },
                  ]}
                >
                  {recording ? <ActivityIndicator color="#FFF" size="small" /> : <Icon icon={Mic} size={18} color={theme.accents.voice.solid} strokeWidth={2} />}
                </Pressable>
                <TextInput
                  style={styles.input}
                  placeholder="Message Aether..."
                  placeholderTextColor={theme.light.inkFaint}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={4000}
                  onSubmitEditing={() => sendMessage()}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={sendMessage}
                  disabled={!input.trim() || sending}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { backgroundColor: theme.accents.voice.solid },
                    (!input.trim() || sending) && styles.sendDisabled,
                    pressed && styles.sendPressed,
                  ]}
                >
                  {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Icon icon={Send} size={18} color="#FFF" strokeWidth={2} />}
                </Pressable>
              </GlassSurface>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  flex: { flex: 1 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...theme.glassType.title, fontSize: 30, fontWeight: Platform.select({ ios: '200', android: '300', default: '200' }), letterSpacing: -0.8, color: theme.light.ink },
  subtitle: { ...theme.glassType.caption, color: theme.light.inkMuted },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  noSession: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, textAlign: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  listOverline: { ...theme.glassType.overline, color: theme.light.inkMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  emptyList: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: theme.accents.voice.solid,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: glassRadius.pill,
    marginTop: spacing.sm,
  },
  newChatLabel: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  convCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: theme.glass.fill,
    borderRadius: glassRadius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.glass.borderInk,
  },
  pressed: { opacity: 0.7 },
  convIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  convText: { flex: 1, gap: 2 },
  convTitle: { ...theme.glassType.label, fontSize: 14 },
  convDate: { ...theme.glassType.caption, fontSize: 11 },
  chipLoader: { paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  messages: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubble: { maxWidth: '85%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  botBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: { fontSize: 15, lineHeight: 23 },
  typing: { paddingVertical: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  statusText: { ...theme.glassType.caption, color: theme.light.inkMuted, flexShrink: 1 },
  composerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    gap: spacing.sm,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,96,228,0.14)',
  },
  input: {
    flex: 1,
    color: theme.light.ink,
    fontSize: 15,
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendPressed: { opacity: 0.8 },
  emptyTitle: { ...theme.glassType.subtitle, fontSize: 16, marginTop: spacing.md, textAlign: 'center' },
  emptyDesc: { ...theme.glassType.body, color: theme.light.inkMuted, marginTop: 4, textAlign: 'center' },
});
