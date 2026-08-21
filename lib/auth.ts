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
  const { data: existing } = await admin
    .from("user_profiles")
    .select("email")
    .eq("email", formData.email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { full_name: formData.fullName },
    },
  });

  if (signUpError) {
    const msg = signUpError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: signUpError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create account." };
  }

  const { error: profileError } = await initializeUserData(
    authData.user.id,
    formData.email,
    formData.fullName
  );

  if (profileError) {
    return { error: profileError };
  }

  return { success: true };
}

export async function signIn(formData: {
  email: string;
  password: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase
      .from("user_profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("user_id", data.user.id);
  }

  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    return { url: data.url };
  }

  return { error: "Failed to initiate Google sign in." };
}

export async function resetPassword(email: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
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
