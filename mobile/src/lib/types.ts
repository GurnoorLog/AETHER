export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  last_login: string;
  onboarding_completed: boolean;
  ai_tutor_name: string;
  theme: string;
  preferences: Record<string, unknown>;
}

export interface AetherSession {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  subject: string | null;
  objectives: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  title: string;
  description: string;
  duration_minutes: number;
  key_topics: string[];
}

export interface RoadmapModule {
  id: string;
  session_id: string;
  user_id: string;
  module_index: number;
  title: string;
  description: string | null;
  status: 'completed' | 'current' | 'locked';
  lessons: Lesson[];
  learning_objectives: string | null;
  key_concepts: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface SessionQuiz {
  id: string;
  session_id: string;
  user_id: string;
  module_id: string | null;
  title: string;
  questions: QuizQuestion[];
  score: number | null;
  total_questions: number;
  completed: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  session_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  retrieved_chunk_ids: string[];
  similarity_scores: number[];
  created_at: string;
}

export interface GeneratedTrack {
  id: string;
  user_id: string;
  title: string;
  prompt: string | null;
  mood: string | null;
  instrument: string | null;
  lyrics: string | null;
  audio_url: string;
  duration: number;
  created_at: string;
  /** Cached local copy of the audio for native playback (never persisted). */
  localUri?: string;
}

export interface AetherDocument {
  id: string;
  user_id: string;
  session_id: string | null;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_at: string;
  status?: 'UPLOADING' | 'EXTRACTING' | 'CHUNKING' | 'EMBEDDING' | 'READY' | 'FAILED';
}

export interface ProgressTracking {
  id: string;
  user_id: string;
  subject: string;
  mastery_level: number;
  last_studied: string;
}

export interface AiMemory {
  id: string;
  user_id: string;
  session_id: string | null;
  content: string;
  context: string;
  created_at: string;
}

export interface GeneratedRoadmap {
  title: string;
  modules: {
    title: string;
    status: 'completed' | 'current' | 'locked';
    description: string;
    learning_objectives: string;
    key_concepts: string;
    lessons: Lesson[];
  }[];
}
