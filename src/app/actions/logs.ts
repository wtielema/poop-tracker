"use server";

import { createClient } from "@/lib/supabase/server";
import type { BristolScale, Mood } from "@/lib/types";

interface CreateLogInput {
  bristol_scale: BristolScale;
  duration_seconds: number;
  mood: Mood;
  note: string | null;
  lat: number | null;
  lng: number | null;
}

interface CreateLogResult {
  streak: number;
  newAchievements: { name: string; icon_emoji: string; description: string }[];
  funFact: string;
}

export async function createLog(data: CreateLogInput): Promise<CreateLogResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Insert the log
  const { error: insertError } = await supabase.from("logs").insert({
    user_id: user.id,
    bristol_scale: data.bristol_scale,
    duration_seconds: data.duration_seconds,
    mood: data.mood,
    note: data.note,
    lat: data.lat,
    lng: data.lng,
  });

  if (insertError) {
    throw new Error(`Failed to create log: ${insertError.message}`);
  }

  // Calculate streak
  const streak = await calculateStreak(supabase, user.id);

  // Check achievements
  const newAchievements = await checkAchievements(supabase, user.id, data);

  // Get a random fun fact
  const funFact = await getRandomFunFact(supabase);

  return { streak, newAchievements, funFact };
}

async function calculateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  // Get logs grouped by date, ordered descending
  const { data: logs } = await supabase
    .from("logs")
    .select("logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  if (!logs || logs.length === 0) return 1;

  // Extract unique dates (in user's local context, but we use UTC date part)
  const dates = [
    ...new Set(logs.map((l) => l.logged_at.substring(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  let streak = 1;
  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);

  // Start from the most recent date
  if (dates[0] !== todayStr) {
    // Check if the most recent log was yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    if (dates[0] !== yesterdayStr) {
      return 1; // Streak broken
    }
  }

  // Count consecutive days
  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(dates[i]);
    const next = new Date(dates[i + 1]);
    const diffMs = current.getTime() - next.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function checkAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: CreateLogInput
): Promise<{ name: string; icon_emoji: string; description: string }[]> {
  // Get all achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  if (!allAchievements) return [];

  // Get user's existing achievements
  const { data: existingAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const existingIds = new Set(
    (existingAchievements ?? []).map((a) => a.achievement_id)
  );

  // Get user's log count and distinct Bristol values
  const { count: logCount } = await supabase
    .from("logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: bristolValues } = await supabase
    .from("logs")
    .select("bristol_scale")
    .eq("user_id", userId);

  const distinctBristol = new Set(
    (bristolValues ?? []).map((l) => l.bristol_scale)
  ).size;

  const hour = new Date().getHours();

  const newlyUnlocked: { name: string; icon_emoji: string; description: string }[] = [];

  for (const achievement of allAchievements) {
    if (existingIds.has(achievement.id)) continue;

    let unlocked = false;

    switch (achievement.slug) {
      case "first_drop":
        unlocked = (logCount ?? 0) === 1;
        break;
      case "speed_demon":
        unlocked = data.duration_seconds < 60;
        break;
      case "marathon_sitter":
        unlocked = data.duration_seconds > 1200;
        break;
      case "night_owl":
        unlocked = hour >= 0 && hour < 5;
        break;
      case "variety_pack":
        unlocked = distinctBristol >= 5;
        break;
    }

    if (unlocked) {
      // Insert user_achievement
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      newlyUnlocked.push({
        name: achievement.name,
        icon_emoji: achievement.icon_emoji,
        description: achievement.description,
      });
    }
  }

  return newlyUnlocked;
}

async function getRandomFunFact(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  // Get count of fun facts
  const { count } = await supabase
    .from("fun_facts")
    .select("*", { count: "exact", head: true });

  if (!count || count === 0) {
    return "The average person spends about 3 months of their lifetime on the toilet!";
  }

  // Pick a random offset
  const offset = Math.floor(Math.random() * count);

  const { data } = await supabase
    .from("fun_facts")
    .select("fact")
    .range(offset, offset)
    .limit(1);

  return data?.[0]?.fact ?? "The average person spends about 3 months of their lifetime on the toilet!";
}
