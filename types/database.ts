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

export interface KnowledgeBase {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_at: string;
  status?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMemory {
  id: string;
  user_id: string;
  content: string;
  context: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  topic: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface LearningAnalytic {
  id: string;
  user_id: string;
  metric: string;
  value: number;
  recorded_at: string;
}

export interface StudyRoadmap {
  id: string;
  user_id: string;
  title: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ProgressTracking {
  id: string;
  user_id: string;
  subject: string;
  mastery_level: number;
  last_studied: string;
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
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}

export type AuthView = "login" | "signup" | "forgot_password";
