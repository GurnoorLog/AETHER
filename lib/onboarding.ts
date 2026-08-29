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

  const { data: tables, error: te } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1);

  if (te) {
    return { error: `Tables check failed: ${te.message} (${te.code})` };
  }

  const { error: pe } = await supabase.from("user_profiles").upsert(
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

  if (pe) {
    return { error: `Profile upsert failed: ${pe.message} (${pe.code})` };
  }

  const { data: ekb } = await supabase
    .from("knowledge_bases")
    .select("id")
    .eq("user_id", formData.userId)
    .maybeSingle();

  if (!ekb) {
    const { error: ke } = await supabase
      .from("knowledge_bases")
      .insert({ user_id: formData.userId });

    if (ke) return { error: `KB insert failed: ${ke.message}` };
  }

  const subjectRows: { user_id: string; subject: string; mastery_level: number }[] = [];
  for (const subject of formData.subjects) {
    subjectRows.push({
      user_id: formData.userId,
      subject,
      mastery_level: 0,
    });
  }

  if (subjectRows.length > 0) {
    const { error: se } = await supabase
      .from("progress_tracking")
      .upsert(subjectRows, { onConflict: "user_id,subject" });

    if (se) {
      return { error: `Subjects upsert failed: ${se.message}` };
    }
  }

  return { success: true };
}
