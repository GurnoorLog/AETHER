import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("user_id, onboarding_completed")
          .eq("user_id", user.id)
          .single();

        if (!profile) {
          const fullName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "User";

          await supabase.from("user_profiles").insert({
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            onboarding_completed: false,
            ai_tutor_name: "Aether",
            theme: "dark",
            preferences: {},
            last_login: new Date().toISOString(),
          });

          await supabase.from("knowledge_bases").insert({ user_id: user.id });
          await supabase.from("conversations").insert({ user_id: user.id, title: "Welcome" });
          await supabase.from("ai_memories").insert({ user_id: user.id, content: "User created account", context: "system" });
          await supabase.from("study_roadmaps").insert({ user_id: user.id, title: "Getting Started", progress: 0 });
          await supabase.from("learning_analytics").insert({ user_id: user.id, metric: "sessions_started", value: 0 });
          await supabase.from("progress_tracking").insert({ user_id: user.id, subject: "General", mastery_level: 0 });

          return NextResponse.redirect(`${origin}/onboarding`);
        }

        if (!profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        return NextResponse.redirect(`${origin}/dashboard`);
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}/dashboard`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/update-password`);
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
