import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const [
    progressData,
    quizzesData,
    modulesData,
    messagesData,
    documentsData,
  ] = await Promise.all([
    supabase
      .from("progress_tracking")
      .select("subject, mastery_level, last_studied")
      .eq("user_id", userId),

    supabase
      .from("session_quizzes")
      .select("score, total_questions, completed, created_at, title")
      .eq("user_id", userId)
      .eq("completed", true),

    supabase
      .from("session_roadmap_modules")
      .select("title, status, completed_at, module_index")
      .eq("user_id", userId)
      .order("module_index", { ascending: true }),

    supabase
      .from("chat_messages")
      .select("created_at, role")
      .eq("user_id", userId)
      .eq("role", "user"),

    supabase
      .from("documents")
      .select("id, created_at:uploaded_at")
      .eq("user_id", userId),
  ]);

  const subjects = progressData.data ?? [];
  const avgMastery =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((sum: number, s: { mastery_level: number | null }) => sum + (s.mastery_level ?? 0), 0) /
            subjects.length
        )
      : 0;

  const allModules = modulesData.data ?? [];
  const completedModules = allModules.filter((m: { status: string }) => m.status === "completed");
  const conceptsLearned = completedModules.length;

  const completedQuizzes = quizzesData.data ?? [];
  const accuracyStreak =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((sum: number, q: { score: number | null; total_questions: number }) => {
            const pct = q.total_questions > 0 ? ((q.score ?? 0) / q.total_questions) * 100 : 0;
            return sum + pct;
          }, 0) / completedQuizzes.length
        )
      : 0;

  const messages = messagesData.data ?? [];
  const dayCounts: Record<string, number> = {
    MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0,
  };
  const dayKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const dayName = dayKeys[d.getDay()];
    dayCounts[dayName]++;
  }

  const maxCount = Math.max(...Object.values(dayCounts), 1);
  const BAR_DATA = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
    (day) => ({
      day,
      height: Math.round((dayCounts[day] / maxCount) * 100),
      peak: dayCounts[day] === maxCount && maxCount > 0,
    })
  );

  // Peak day name for hero subtitle
  const peakDay = BAR_DATA.find((b) => b.peak)?.day ?? "MON";

  const totalMessages = messages.length;
  const studyMinutes = totalMessages * 2;
  const studyHours = Math.round((studyMinutes / 60) * 10) / 10;

  const quizXP = completedQuizzes.reduce(
    (sum: number, q: { score: number | null }) => sum + (q.score ?? 0) * 50,
    0
  );
  const reviewXP = totalMessages * 10;
  const analysisXP = (documentsData.data?.length ?? 0) * 25;
  const totalXP = quizXP + reviewXP + analysisXP;

  const level = Math.floor(totalXP / 1000) + 1;
  const xpInLevel = totalXP % 1000;
  const levelProgress = Math.round((xpInLevel / 1000) * 100);

  const sortedSubjects = [...subjects].sort(
    (a: { mastery_level: number | null }, b: { mastery_level: number | null }) =>
      (b.mastery_level ?? 0) - (a.mastery_level ?? 0)
  );
  const strengths = sortedSubjects
    .filter((s: { mastery_level: number | null }) => (s.mastery_level ?? 0) >= 70)
    .slice(0, 3)
    .map((s: { subject: string; mastery_level: number | null }) => ({
      name: s.subject,
      mastery: s.mastery_level ?? 0,
    }));
  const weaknesses = sortedSubjects
    .filter((s: { mastery_level: number | null }) => (s.mastery_level ?? 0) < 70)
    .slice(0, 3)
    .map((s: { subject: string; mastery_level: number | null }) => ({
      name: s.subject,
      mastery: s.mastery_level ?? 0,
    }));

  const milestones = completedModules.slice(0, 4).map((m: { title: string }) => ({
    title: m.title,
    completed: true,
  }));

  const trendByDay: Record<string, number> = {
    MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0,
  };
  for (const msg of messages) {
    const d = new Date(msg.created_at);
    trendByDay[dayKeys[d.getDay()]]++;
  }

  // Week range: Monday to Sunday of current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const weekRange = `${monthNames[monday.getMonth()]} ${monday.getDate()} - ${sunday.getDate()}`;

  // Next module (first non-completed module) for third recommendation card
  const nextModule = allModules.find(
    (m: { status: string }) => m.status === "current" || m.status === "locked"
  );
  const nextModuleName = nextModule?.title ?? null;

  // Recent high score: any quiz completed with 90%+ in last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentHighScore = completedQuizzes.some(
    (q: { score: number | null; total_questions: number; created_at: string }) => {
      const pct = q.total_questions > 0 ? ((q.score ?? 0) / q.total_questions) * 100 : 0;
      return pct >= 90 && new Date(q.created_at) >= sevenDaysAgo;
    }
  );

  // Top quiz title for trophy notification
  const topQuiz = completedQuizzes
    .filter((q: { score: number | null; total_questions: number }) => {
      const pct = q.total_questions > 0 ? ((q.score ?? 0) / q.total_questions) * 100 : 0;
      return pct >= 90;
    })
    .sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  const topQuizTitle = topQuiz?.title ?? null;

  return NextResponse.json({
    avgMastery,
    conceptsLearned,
    accuracyStreak,
    BAR_DATA,
    studyHours,
    totalXP,
    level,
    levelProgress,
    xpBreakdown: { quizzes: quizXP, reviews: reviewXP, analysis: analysisXP },
    strengths,
    weaknesses,
    milestones,
    trendByDay,
    weekRange,
    peakDay,
    nextModuleName,
    recentHighScore,
    topQuizTitle,
  });
}
