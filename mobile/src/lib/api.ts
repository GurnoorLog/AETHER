import type { Session } from '@supabase/supabase-js';
import { File, Paths } from 'expo-file-system';
import { SITE_URL } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { GeneratedRoadmap, QuizQuestion } from '@/lib/types';

const AUTH_KEY = 'sb-svnprtygyjhtnktbiyqv-auth-token';

function b64urlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Same chunking as @supabase/ssr / siteCookie.ts, but as a Cookie header for fetch.
export function sessionToCookieHeader(session: Session): string {
  const value = 'base64-' + b64urlEncode(JSON.stringify(session));
  if (value.length <= 3180) return `${AUTH_KEY}=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * 3180 < value.length; i++) {
    parts.push(`${AUTH_KEY}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  }
  return parts.join('; ');
}

export async function getSessionOrThrow(): Promise<Session> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getSessionOrThrow();
  return fetch(`${SITE_URL}${path}`, {
    ...init,
    headers: {
      Cookie: sessionToCookieHeader(session),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export interface CreatedSession {
  sessionId: string;
  slug: string;
  title: string;
}

// Mirrors the site's CreateSessionModal: insert sessions + progress_tracking,
// generate the AI roadmap, update the title, and insert roadmap modules.
export async function createSession(input: {
  subject: string;
  objectives?: string;
}): Promise<CreatedSession> {
  const session = await getSessionOrThrow();
  const userId = session.user.id;
  const subject = input.subject.trim();
  const objectives = input.objectives?.trim();
  const slug = `${slugify(subject)}-${Date.now()}`;

  const { data: created, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title: `${subject} Study Session`,
      slug,
      subject,
      objectives: objectives || null,
    })
    .select('id, slug')
    .single();
  if (sessionError || !created) throw new Error(sessionError?.message || 'Failed to create session');

  await supabase.from('progress_tracking').upsert({
    user_id: userId,
    subject,
    mastery_level: 0,
    session_id: created.id,
  }); // ponytail: 409 = row already exists, ignore

  const roadmap = await generateRoadmap({ subject, objectives });
  if (roadmap.modules?.length > 0) {
    if (roadmap.title) {
      await supabase.from('sessions').update({ title: roadmap.title }).eq('id', created.id);
    }
    const modulesToInsert = roadmap.modules.map((mod, i) => ({
      session_id: created.id,
      user_id: userId,
      module_index: i,
      title: mod.title,
      description: mod.description,
      status: i === 0 ? 'current' : 'locked',
      lessons: JSON.stringify(mod.lessons || []),
      learning_objectives: mod.learning_objectives || null,
      key_concepts: mod.key_concepts || null,
    }));
    await supabase.from('session_roadmap_modules').insert(modulesToInsert);
  }

  return { sessionId: created.id, slug: created.slug, title: roadmap.title || `${subject} Study Session` };
}

// --- Progress ---

export interface ProgressReport {
  avgMastery: number;
  conceptsLearned: number;
  accuracyStreak: number;
  BAR_DATA: { day: string; height: number; peak: boolean }[];
  studyHours: number;
  totalXP: number;
  level: number;
  levelProgress: number;
  xpBreakdown: { quizzes: number; reviews: number; analysis: number };
  strengths: { name: string; mastery: number }[];
  weaknesses: { name: string; mastery: number }[];
  milestones: { title: string; completed: boolean }[];
  trendByDay: Record<string, number>;
  weekRange: string;
  peakDay: string;
  nextModuleName: string | null;
  recentHighScore: boolean;
  topQuizTitle: string | null;
}

export async function getProgress(sessionId?: string): Promise<ProgressReport> {
  const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  const res = await apiFetch(`/api/progress${qs}`);
  if (!res.ok) throw new Error(`Progress failed: ${res.status}`);
  return res.json();
}

// --- Roadmap ---

export async function generateRoadmap(input: {
  subject: string;
  mode?: string;
  difficulty?: string;
  duration?: string;
  objectives?: string;
}): Promise<GeneratedRoadmap> {
  const res = await apiFetch('/api/session-creation/generate-roadmap', {
    method: 'POST',
    body: JSON.stringify({
      subject: input.subject,
      mode: input.mode ?? 'Interactive',
      difficulty: input.difficulty ?? 'Intermediate',
      duration: input.duration ?? '60m',
      objectives: input.objectives ?? '',
    }),
  });
  if (!res.ok) throw new Error(`Roadmap failed: ${res.status}`);
  return res.json();
}

// --- Quizzes ---

export async function generateQuiz(input: {
  session_id?: string | null;
  module_id?: string | null;
  subject?: string;
  title?: string;
  num_questions?: number;
}): Promise<{ quiz: { id: string; title: string; questions: QuizQuestion[]; total_questions: number; created_at: string } }> {
  const res = await apiFetch('/api/quizzes/generate', {
    method: 'POST',
    body: JSON.stringify({
      session_id: input.session_id ?? null,
      module_id: input.module_id ?? null,
      subject: input.subject,
      title: input.title,
      num_questions: input.num_questions ?? 8,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Quiz generation failed: ${res.status}`);
  }
  return res.json();
}

export async function submitQuiz(quizId: string, score: number): Promise<void> {
  const res = await apiFetch('/api/quizzes/submit', {
    method: 'POST',
    body: JSON.stringify({ quiz_id: quizId, score }),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
}

// --- Music ---

export async function enhanceMusicPrompt(input: {
  userText: string;
  mood: string;
  instrument: string;
}): Promise<{ lyrics: string; enhanced_prompt: string }> {
  const res = await apiFetch('/api/music/enhance-prompt', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Enhance failed: ${res.status}`);
  return res.json();
}

const COLAB_API = 'https://relic-dweller-remix.ngrok-free.dev';

// Mirrors the site's music page: POST prompt/lyrics to the COLAB backend, get
// an audio_url, then re-host it through the cookie-authed proxy.
export async function generateTrack(input: {
  prompt: string;
  lyrics?: string;
  duration?: number;
  provider?: 'heartmula' | 'musicgen';
}): Promise<{ audio_url: string }> {
  const endpoint = input.provider === 'musicgen' ? '/generate-musicgen' : '/generate';
  const res = await fetch(`${COLAB_API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: input.lyrics ? `${input.lyrics}\n\n${input.prompt}` : input.prompt,
      lyrics: input.provider === 'musicgen' ? undefined : input.lyrics,
      duration: input.duration ?? 30,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Music API error: ${res.status}`);
  }
  const result = await res.json();
  return { audio_url: `/api/proxy-audio?url=${encodeURIComponent(result.audio_url)}` };
}

// The proxy-audio endpoint requires the session cookie, which native players
// can't send. Fetch the bytes with our cookie header and cache them locally.
export async function downloadAudio(audioUrl: string): Promise<string> {
  const res = await apiFetch(audioUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const file = new File(Paths.cache, `track-${Date.now()}.mp3`);
  file.write(bytes);
  return file.uri;
}

// --- Challenges ---

export async function generateChallenge(input: {
  subject: string;
  topic: string;
  language?: string;
  type?: 'code' | 'math';
}): Promise<Record<string, unknown>> {
  const res = await apiFetch('/api/challenges/generate', {
    method: 'POST',
    body: JSON.stringify({
      subject: input.subject,
      topic: input.topic,
      language: input.language ?? 'python',
      type: input.type ?? 'code',
    }),
  });
  if (!res.ok) throw new Error(`Challenge failed: ${res.status}`);
  return res.json();
}

// --- TTS ---

export async function tts(text: string, voice?: string): Promise<string> {
  const res = await apiFetch('/api/tts', { method: 'POST', body: JSON.stringify({ text, voice }) });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Fetch TTS audio to a local cache file so expo-audio can play it (native
// players can't send the session cookie). Mirrors downloadAudio.
export async function ttsToFile(text: string, voice?: string): Promise<string> {
  const res = await apiFetch('/api/tts', { method: 'POST', body: JSON.stringify({ text, voice }) });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const blob = await res.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const file = new File(Paths.cache, `voice-${Date.now()}.mp3`);
  file.write(bytes);
  return file.uri;
}

// STT for the voice tutor. Uploads the recorded audio as a multipart file (RN
// rejects plain {uri,name,type} objects as "Unsupported FormDataPart", so we
// append an expo-file-system File directly); the server does the Deepgram call
// (the session cookie authenticates it).
export async function transcribeAudio(uri: string): Promise<string> {
  const session = await getSessionOrThrow();
  const form = new FormData();
  form.append('file', new File(uri));

  const res = await fetch(`${SITE_URL}/api/transcribe`, {
    method: 'POST',
    headers: { Cookie: sessionToCookieHeader(session) },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Transcribe failed: ${res.status}`);
  }
  const json = await res.json();
  return json.transcript ?? '';
}

// --- Knowledge base ---

// Mirrors the site's /api/knowledge/image: uploads an image into the session's
// knowledge base (RAG), so the tutor can cite it. Cookie auth, multipart body.
export async function uploadKnowledgeImage(uri: string, name: string, mime: string, sessionId: string): Promise<{ doc_id: string; filename: string }> {
  const session = await getSessionOrThrow();
  const form = new FormData();
  form.append('file', new File(uri));
  form.append('session_id', sessionId);

  const res = await fetch(`${SITE_URL}/api/knowledge/image`, {
    method: 'POST',
    headers: { Cookie: sessionToCookieHeader(session) },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `Upload failed: ${res.status}`);
  }
  return { doc_id: json.doc_id, filename: json.filename };
}

// --- Subscription (RevenueCat) ---
// Handled via useRevenueCat hook and src/lib/revenuecat.ts — no server-side Stripe needed.

// --- Chat (SSE) ---

export type ChatEvent =
  | { type: 'status'; text: string }
  | { type: 'chunk'; text: string }
  | { type: 'done'; message_id: string | null; chunks_used: number }
  | { type: 'error'; error: string };

export async function streamChat(
  input: { message: string; conversation_id: string; session_id?: string | null; module_context?: unknown },
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const session = await getSessionOrThrow();
  const res = await fetch(`${SITE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      Cookie: sessionToCookieHeader(session),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok || !res.body) {
    onEvent({ type: 'error', error: `Chat failed: ${res.status}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        onEvent(JSON.parse(jsonStr) as ChatEvent);
      } catch {
        // skip malformed chunks
      }
    }
  }
}
