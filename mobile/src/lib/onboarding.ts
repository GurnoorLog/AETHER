import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const SUBJECTS = ['Mathematics', 'Computer Science', 'Biology', 'Physics', 'Medicine', 'Engineering', 'Languages', 'History', 'Psychology', 'Economics'];

export const EDUCATION_LEVELS = ['High School', 'College', 'University', 'Graduate', 'Self Learner'];

export const LEARNING_STYLES = [
  { id: 'step_by_step', label: 'Step-by-step explanations' },
  { id: 'visual', label: 'Visual diagrams' },
  { id: 'real_world', label: 'Real-world examples' },
  { id: 'conversations', label: 'Interactive conversations' },
  { id: 'practice', label: 'Practice questions' },
  { id: 'summaries', label: 'Short summaries' },
] as const;

export const GOALS = ['Pass exams', 'Improve grades', 'Learn a new subject', 'Prepare for interviews', 'Understand difficult concepts', 'Build practical skills'];

// Creates the user's starter rows if they don't exist yet. Mirrors the site's
// initializeUserData (lib/db.ts); all these tables have RLS "manage own" ALL
// policies, so the signed-in client can write directly.
export async function ensureUserData(userId: string, email: string, fullName: string): Promise<{ error: string | null }> {
  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: userId,
    email,
    full_name: fullName,
    avatar_url: null,
    onboarding_completed: false,
    ai_tutor_name: 'Aether',
    theme: 'dark',
    preferences: {},
    last_login: new Date().toISOString(),
  });

  if (profileError) {
    return { error: profileError.message };
  }

  const inserts = [
    supabase.from('knowledge_bases').insert({ user_id: userId }),
    supabase.from('conversations').insert({ user_id: userId, title: 'Welcome' }),
    supabase.from('ai_memories').insert({ user_id: userId, content: 'User created account', context: 'system' }),
    supabase.from('study_roadmaps').insert({ user_id: userId, title: 'Getting Started', progress: 0 }),
    supabase.from('learning_analytics').insert({ user_id: userId, metric: 'sessions_started', value: 0 }),
    supabase.from('progress_tracking').insert({ user_id: userId, subject: 'General', mastery_level: 0 }),
  ];

  const results = await Promise.allSettled(inserts);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Failed to initialize user data:', result.reason);
    }
  }

  return { error: null };
}

// Mirrors the site's completeOnboarding (lib/onboarding.ts).
// Returns '/(tabs)' when the profile exists and onboarding is complete,
// '/onboarding' otherwise. Creates the starter rows on first sign-in
// (the profile can't be made at signUp — email confirmation has no session).
export async function routeAfterLogin(user: User, fallbackEmail: string): Promise<'/(tabs)' | '/onboarding'> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) {
    await ensureUserData(user.id, user.email ?? fallbackEmail, user.user_metadata?.full_name ?? '');
  }
  return profile && profile.onboarding_completed ? '/(tabs)' : '/onboarding';
}

export async function completeOnboarding(input: {
  userId: string;
  fullName: string;
  email: string;
  subjects: string[];
  preferences: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      user_id: input.userId,
      email: input.email,
      full_name: input.fullName,
      onboarding_completed: true,
      preferences: input.preferences,
      last_login: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (profileError) {
    return { error: `Profile upsert failed: ${profileError.message}` };
  }

  const { data: existingKb } = await supabase.from('knowledge_bases').select('id').eq('user_id', input.userId).maybeSingle();
  if (!existingKb) {
    const { error: kbError } = await supabase.from('knowledge_bases').insert({ user_id: input.userId });
    if (kbError) return { error: `KB insert failed: ${kbError.message}` };
  }

  if (input.subjects.length > 0) {
    const { error: subjectsError } = await supabase
      .from('progress_tracking')
      .upsert(
        input.subjects.map((subject) => ({ user_id: input.userId, subject, mastery_level: 0 })),
        { onConflict: 'user_id,subject' }
      );
    if (subjectsError) {
      return { error: `Subjects upsert failed: ${subjectsError.message}` };
    }
  }

  return { error: null };
}
