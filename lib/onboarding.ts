"use server";

import { createClient } from "@supabase/supabase-js";

export async function completeOnboarding(formData: {
  userId: string;
  fullName: string;
  email: string;
  subjects: string[];
  preferences: Record<string, unknown>;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tables, error: tablesError } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1);

  if (tablesError) {
    return { error: `Tables check failed: ${tablesError.message} (${tablesError.code})` };
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: formData.userId,
      email: formData.email,
      full_name: formData.fullName,
      onboarding_completed: true,
      preferences: formData.preferences,
      last_login: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    return { error: `Profile upsert failed: ${profileError.message} (${profileError.code})` };
  }

  const { data: existingKb } = await supabase
    .from("knowledge_bases")
    .select("id")
    .eq("user_id", formData.userId)
    .maybeSingle();

  if (!existingKb) {
    const { error: kbError } = await supabase
      .from("knowledge_bases")
      .insert({ user_id: formData.userId });

    if (kbError) return { error: `KB insert failed: ${kbError.message}` };
  }

  const subjectRows = formData.subjects.map((subject) => ({
    user_id: formData.userId,
    subject,
    mastery_level: 0,
  }));

  if (subjectRows.length > 0) {
    const { error: subjectsError } = await supabase
      .from("progress_tracking")
      .upsert(subjectRows, { onConflict: "user_id,subject" });

    if (subjectsError) {
      return { error: `Subjects upsert failed: ${subjectsError.message}` };
    }
  }

  return { success: true };
}
