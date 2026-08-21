import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quiz_id, score, answers } = await req.json();

  if (!quiz_id || score === undefined) {
    return NextResponse.json({ error: "quiz_id and score are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("session_quizzes")
    .update({ score, completed: true })
    .eq("id", quiz_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
