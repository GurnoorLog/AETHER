"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeUserData } from "@/lib/db";

export async function signUp(formData: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = await createServerSupabaseClient();

  const admin = createAdminClient();
  const { data: found } = await admin
    .from("user_profiles")
    .select("email")
    .eq("email", formData.email.toLowerCase().trim())
    .maybeSingle();

  if (found) {
    return { error: "An account with this email already exists." };
  }

  const { data: auth, error: supErr } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { full_name: formData.fullName },
    },
  });

  if (supErr) {
    const msg = supErr.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: supErr.message };
  }

  if (!auth.user) {
    return { error: "Failed to create account." };
  }

  const { error: initErr } = await initializeUserData(
    auth.user.id,
    formData.email,
    formData.fullName
  );

  if (initErr) {
    return { error: initErr };
  }

  return { success: true };
}

export async function signIn(formData: {
  email: string;
  password: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: res, error: err } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (err) {
    return { error: err.message };
  }

  if (res.user) {
    await supabase
      .from("user_profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("user_id", res.user.id);
  }

  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  const { data: res, error: err } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (err) {
    return { error: err.message };
  }

  if (res.url) {
    return { url: res.url };
  }

  return { error: "Failed to initiate Google sign in." };
}

export async function resetPassword(email: string) {
  const supabase = await createServerSupabaseClient();

  const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  });

  if (err) {
    return { error: err.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error: err } = await supabase.auth.signOut();

  if (err) {
    return { error: err.message };
  }

  return { success: true };
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
