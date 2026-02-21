"use server";

import { createClient } from "@/lib/supabase/server";
import { checkAchievements as checkAchievementsPure } from "@/lib/achievements";
import { calculateStreak as calcStreak } from "@/lib/streaks";
import type { AchievementContext } from "@/lib/achievements";
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
  const { data: insertedLog, error: insertError } = await supabase
    .from("logs")
    .insert({
      user_id: user.id,
      bristol_scale: data.bristol_scale,
      duration_seconds: data.duration_seconds,
      mood: data.mood,
      note: data.note,
      lat: data.lat,
      lng: data.lng,
    })
    .select("logged_at")
    .single();

  if (insertError) {
    throw new Error(`Failed to create log: ${insertError.message}`);
  }

  // Calculate streak
  const streak = await calculateStreakFromDb(supabase, user.id);

  // Check achievements using the pure function
  const newAchievements = await checkAchievements(
    supabase,
    user.id,
    data,
    streak,
    insertedLog.logged_at,
  );

  // Get a random fun fact
  const funFact = await getRandomFunFact(supabase);

  return { streak, newAchievements, funFact };
}

async function calculateStreakFromDb(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { data: logs } = await supabase
    .from("logs")
    .select("logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  if (!logs || logs.length === 0) return 1;

  const streak = calcStreak(logs.map((l) => l.logged_at));
  // Original behavior: minimum streak of 1 after logging (since we just inserted)
  return Math.max(streak, 1);
}

async function checkAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: CreateLogInput,
  currentStreak: number,
  loggedAt: string,
): Promise<{ name: string; icon_emoji: string; description: string }[]> {
  // Get all achievements defined in DB
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  if (!allAchievements) return [];

  // Gather all context data in parallel for the pure achievement checker
  const [
    existingAchievementsResult,
    logCountResult,
    bristolValuesResult,
    recentLogsResult,
    friendCountResult,
    completedChallengesResult,
    locationLogsResult,
  ] = await Promise.all([
    // Existing achievements (slugs via join, or achievement_ids then map)
    supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId),

    // Total log count
    supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    // All Bristol values logged
    supabase
      .from("logs")
      .select("bristol_scale")
      .eq("user_id", userId),

    // Recent log times (last 7, for creature_of_habit and perfect_week)
    supabase
      .from("logs")
      .select("logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(30), // get more than 7 for perfect_week (needs full week coverage)

    // Friend count
    supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),

    // Completed challenges count
    supabase
      .from("challenge_participants")
      .select("challenge_id, progress, challenges!inner(target)")
      .eq("user_id", userId)
      .gte("progress", 0), // we'll filter completed ones below

    // Logs with location data for unique location count
    supabase
      .from("logs")
      .select("lat, lng")
      .eq("user_id", userId)
      .not("lat", "is", null)
      .not("lng", "is", null),
  ]);

  // Map existing achievement IDs to slugs
  const existingAchievementIds = new Set(
    (existingAchievementsResult.data ?? []).map((a) => a.achievement_id)
  );
  const existingSlugs = allAchievements
    .filter((a) => existingAchievementIds.has(a.id))
    .map((a) => a.slug);

  // Distinct Bristol types
  const allBristolTypes = [
    ...new Set((bristolValuesResult.data ?? []).map((l) => l.bristol_scale as number)),
  ];

  // Log times for creature_of_habit / perfect_week
  const logTimes = (recentLogsResult.data ?? []).map((l) => l.logged_at);

  // Count completed challenges (where progress >= target)
  const completedChallenges = (completedChallengesResult.data ?? []).filter(
    (cp) => {
      const challenge = cp.challenges as unknown as { target: number } | null;
      return challenge && cp.progress >= challenge.target;
    }
  ).length;

  // Unique locations (rounded to 1 decimal place)
  const locationSet = new Set<string>();
  for (const log of locationLogsResult.data ?? []) {
    if (log.lat != null && log.lng != null) {
      const key = `${Math.round(log.lat * 10) / 10},${Math.round(log.lng * 10) / 10}`;
      locationSet.add(key);
    }
  }

  // Build the context for the pure function
  const ctx: AchievementContext = {
    totalLogs: logCountResult.count ?? 0,
    currentStreak,
    latestLog: {
      bristol_scale: data.bristol_scale,
      duration_seconds: data.duration_seconds,
      logged_at: loggedAt,
      lat: data.lat,
      lng: data.lng,
    },
    allBristolTypes,
    friendCount: friendCountResult.count ?? 0,
    completedChallenges,
    logTimes,
    uniqueLocations: locationSet.size,
    existingAchievements: existingSlugs,
  };

  // Run the pure achievement checker
  const newSlugs = checkAchievementsPure(ctx);

  if (newSlugs.length === 0) return [];

  // Map slugs back to achievement records and insert user_achievements
  const newlyUnlocked: { name: string; icon_emoji: string; description: string }[] = [];

  for (const slug of newSlugs) {
    const achievement = allAchievements.find((a) => a.slug === slug);
    if (!achievement) continue;

    // Insert user_achievement row
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
