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
import { Icon } from '@/components/glass/Icon';
import { MarkdownText } from '@/components/glass/MarkdownText';
import { BottomNav } from '@/components/BottomNav';
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
  Volume2,
} from '@/components/glass/icons';

const GREEN = '#6B8E61';

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

const MessageBubble = memo(function MessageBubble({ m }: { m: LocalMessage }) {
  const isUser = m.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Icon icon={Bot} size={16} color={GREEN} />
        </View>
      )}
      {isUser ? (
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userBubbleText}>{m.content}</Text>
        </View>
      ) : m.content ? (
        <View style={[styles.bubble, styles.botBubble]}>
          <MarkdownText content={m.content} color="#555" />
        </View>
      ) : m.streaming ? (
        <View style={[styles.bubble, styles.botBubble]}>
          <ActivityIndicator color={GREEN} size="small" style={{ paddingVertical: 4 }} />
        </View>
      ) : null}
    </View>
  );
});

export default function TutorTab() {
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
    if (!authSession || !session) { setConversations([]); setLoading(false); return; }
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

  useEffect(() => { fetchConversations(); }, [fetchConversations, focused]);

  useEffect(() => {
    if (pendingConversation) {
      const convId = String(pendingConversation);
      router.setParams({ conversation: '' });
      setActiveId(convId);
    }
  }, [pendingConversation, router]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    fetchMessages(activeId);
  }, [activeId, focused, fetchMessages]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, status]);

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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
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
    } finally { setAttaching(false); }
  };

  const deleteConversation = (convId: string) => {
    Alert.alert('Delete conversation', 'Delete this chat and all its messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('chat_messages').delete().eq('conversation_id', convId);
          await supabase.from('conversations').delete().eq('id', convId);
          setConversations((prev) => prev.filter((c) => c.id !== convId));
          if (activeId === convId) { setActiveId(null); setMessages([]); }
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
          if (e.type === 'status') setStatus(e.text);
          else if (e.type === 'chunk') { fullText += e.text; setStatus(null); setMessages((prev) => prev.map((m) => (m.id === '__streaming__' ? { ...m, content: fullText } : m))); }
          else if (e.type === 'error') throw new Error(e.error);
        },
      );
      if (speaking && fullText.trim()) speak(fullText);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== '__streaming__'));
      setStatus(err instanceof Error ? err.message : 'Chat failed');
    } finally {
      setSending(false);
      setMessages((prev) => prev.map((m) => (m.id === '__streaming__' ? { ...m, streaming: false } : m)));
    }
  };

  const sendMessage = () => sendText(input);

  const speak = async (text: string) => {
    try { const uri = await ttsToFile(text); setReplyUri(uri); } catch { /* non-fatal */ }
  };

  useEffect(() => { if (!replyUri) return; replyPlayer.replace(replyUri); }, [replyUri, replyPlayer]);
  useEffect(() => { if (replyUri && replyStatus.isLoaded && !replyStatus.playing) replyPlayer.play(); }, [replyUri, replyStatus, replyPlayer]);

  const startListening = async () => {
    if (sending || recording) return;
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { Alert.alert('Microphone access needed', 'Enable mic permission to use the voice tutor.'); return; }
    try { await recorder.prepareToRecordAsync(); recorder.record(); setRecording(true); setStatus('Listening…'); }
    catch { Alert.alert('Recording failed', 'Could not start the microphone.'); }
  };

  const stopListening = async () => {
    if (!recording) return;
    setRecording(false);
    setStatus('Transcribing…');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { setStatus('Nothing recorded'); return; }
      const transcript = await transcribeAudio(uri);
      if (transcript.trim()) { setStatus(null); sendText(transcript); }
      else setStatus('No speech heard — try again');
    } catch (err) { setStatus(err instanceof Error ? err.message : 'Transcription failed'); }
  };

  useEffect(() => { if (!activeId) return; replyPlayer.pause(); setReplyUri(null); }, [activeId, replyPlayer]);
  useEffect(() => () => { replyPlayer.pause(); }, [replyPlayer]);

  const needsSession = !session;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{activeId ? 'Chat' : 'Tutor'}</Text>
            <Text style={styles.subtitle}>{session?.title ?? 'No session selected'}</Text>
          </View>
          <View style={styles.headerActions}>
            {activeId ? (
              <>
                <Pressable style={styles.headerBtn} onPress={() => router.push({ pathname: '/voice-tutor', params: { conversationId: activeId } })}>
                  <Icon icon={AudioLines} size={20} color={GREEN} />
                </Pressable>
                <Pressable style={styles.headerBtn} onPress={() => setActiveId(null)}>
                  <Icon icon={ChevronLeft} size={20} color="#999" />
                </Pressable>
              </>
            ) : null}
            <Pressable style={styles.headerBtn} onPress={() => setSpeaking((s) => !s)}>
              <Icon icon={Volume2} size={20} color={speaking ? GREEN : '#CCC'} />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={createConversation}>
              <Icon icon={Plus} size={20} color={GREEN} />
            </Pressable>
          </View>
        </View>

        {needsSession ? (
          <View style={styles.center}>
            <View style={styles.emptyCard}>
              <Icon icon={MessageSquareText} size={32} color="#CCC" />
              <Text style={styles.emptyTitle}>Select a session first</Text>
              <Text style={styles.emptyDesc}>Pick a session from the Hub, then come back to chat with Aether.</Text>
            </View>
          </View>
        ) : !activeId ? (
          /* Conversation list */
          <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Recent Conversations</Text>
            {loading ? (
              <ActivityIndicator color={GREEN} style={{ paddingVertical: 16 }} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyList}>
                <Icon icon={Bot} size={40} color="#CCC" />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptyDesc}>Ask Aether anything about {session.subject || 'this subject'}.</Text>
                <Pressable style={styles.createChatBtn} onPress={createConversation}>
                  <Icon icon={Plus} size={16} color="#FFF" strokeWidth={2} />
                  <Text style={styles.createChatBtnText}>New Chat</Text>
                </Pressable>
              </View>
            ) : (
              conversations.map((c) => (
                <View key={c.id} style={styles.convRow}>
                  <Pressable style={styles.convCard} onPress={() => setActiveId(c.id)}>
                    <View style={styles.convIcon}>
                      <Icon icon={MessageSquareText} size={18} color={GREEN} />
                    </View>
                    <View style={styles.convText}>
                      <Text style={styles.convTitle} numberOfLines={1}>{c.title}</Text>
                      <Text style={styles.convDate}>{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Icon icon={ChevronRight} size={16} color="#CCC" />
                  </Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => deleteConversation(c.id)} hitSlop={8}>
                    <Icon icon={Trash2} size={14} color="#CCC" />
                  </Pressable>
                </View>
              ))
            )}
            <View style={{ height: 120 }} />
          </ScrollView>
        ) : (
          /* Active chat */
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.messages}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && !sending ? (
                <View style={styles.center}>
                  <Icon icon={Bot} size={44} color="#CCC" />
                  <Text style={styles.emptyTitle}>Ask anything about {session.subject || 'this subject'}</Text>
                  <Text style={styles.emptyDesc}>Aether searches your documents and answers with citations.</Text>
                </View>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} m={m} />)
              )}
              {status ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={GREEN} size="small" />
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Composer */}
            <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 90 }]}>
              <View style={styles.composer}>
                <Pressable style={styles.attachBtn} onPress={attachImage} disabled={sending || attaching}>
                  {attaching ? <ActivityIndicator color={GREEN} size="small" /> : <Icon icon={Camera} size={18} color={GREEN} strokeWidth={2} />}
                </Pressable>
                <Pressable
                  style={[styles.micBtn, { backgroundColor: recording ? GREEN : '#E8F0E5' }]}
                  onPressIn={startListening}
                  onPressOut={stopListening}
                  disabled={sending}
                >
                  {recording ? <ActivityIndicator color="#FFF" size="small" /> : <Icon icon={Mic} size={18} color={GREEN} strokeWidth={2} />}
                </Pressable>
                <TextInput
                  style={styles.input}
                  placeholder="Message Aether..."
                  placeholderTextColor="#CCC"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={4000}
                  onSubmitEditing={() => sendMessage()}
                  returnKeyType="send"
                />
                <Pressable
                  style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
                  onPress={sendMessage}
                  disabled={!input.trim() || sending}
                >
                  {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Icon icon={Send} size={18} color="#FFF" strokeWidth={2} />}
                </Pressable>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12 },
  headerText: { flex: 1, gap: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 12, color: '#999' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3EDE3', alignItems: 'center', justifyContent: 'center' },

  // Empty states
  emptyCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3EDE3', padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 6 },

  // Conversation list
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  emptyList: { alignItems: 'center', paddingVertical: 40 },
  createChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginTop: 16 },
  createChatBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  convCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', paddingHorizontal: 16, paddingVertical: 14 },
  convIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  convText: { flex: 1, gap: 2 },
  convTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  convDate: { fontSize: 11, color: '#BBB' },
  deleteBtn: { padding: 8 },

  // Messages
  messages: { paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { backgroundColor: GREEN, borderBottomRightRadius: 6 },
  botBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#F3EDE3' },
  userBubbleText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  statusText: { fontSize: 12, color: '#999', flexShrink: 1 },

  // Composer
  composerWrap: { paddingHorizontal: 24, paddingTop: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFF', borderRadius: 28, borderWidth: 1, borderColor: '#F3EDE3', paddingVertical: 6, paddingLeft: 8, paddingRight: 6, gap: 6 },
  attachBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, color: '#333', fontSize: 15, maxHeight: 120, paddingTop: 8, paddingBottom: 8 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
