import { createClient } from "@supabase/supabase-js";

export async function initializeUserData(
  userId: string,
  email: string,
  fullName: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: pe } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      email,
      full_name: fullName,
      avatar_url: null,
      onboarding_completed: false,
      ai_tutor_name: "Aether",
      theme: "dark",
      preferences: {},
      last_login: new Date().toISOString(),
    });

  if (pe) {
    return { error: pe.message };
  }

  const writes = [
    supabase.from("knowledge_bases").insert({ user_id: userId }),
    supabase.from("conversations").insert({ user_id: userId, title: "Welcome" }),
    supabase.from("ai_memories").insert({ user_id: userId, content: "User created account", context: "system" }),
    supabase.from("study_roadmaps").insert({ user_id: userId, title: "Getting Started", progress: 0 }),
    supabase.from("learning_analytics").insert({ user_id: userId, metric: "sessions_started", value: 0 }),
    supabase.from("progress_tracking").insert({ user_id: userId, subject: "General", mastery_level: 0 }),
  ];

  const settled = await Promise.allSettled(writes);
  for (const each of settled) {
    if (each.status === "rejected") {
      console.error("Failed to initialize user data:", each.reason);
    }
  }

  return { error: null };
}
