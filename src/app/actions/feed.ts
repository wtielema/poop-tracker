"use server";

import { createClient } from "@/lib/supabase/server";

interface FeedEvent {
  id: string;
  text: string;
  emoji: string;
  time: string;
}

interface DashboardData {
  streak: number;
  loggedToday: boolean;
  dailyFact: string;
  feedEvents: FeedEvent[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Run independent queries in parallel
  const [streakResult, factResult, feedResult] = await Promise.all([
    calculateStreakAndToday(supabase, user.id),
    getDailyFunFact(supabase),
    getFriendFeed(supabase, user.id),
  ]);

  return {
    streak: streakResult.streak,
    loggedToday: streakResult.loggedToday,
    dailyFact: factResult,
    feedEvents: feedResult,
  };
}

async function calculateStreakAndToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ streak: number; loggedToday: boolean }> {
  const { data: logs } = await supabase
    .from("logs")
    .select("logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  if (!logs || logs.length === 0) {
    return { streak: 0, loggedToday: false };
  }

  // Extract unique dates
  const dates = [
    ...new Set(logs.map((l) => l.logged_at.substring(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);
  const loggedToday = dates[0] === todayStr;

  // Calculate streak
  let streak = 0;

  // Check if most recent log is today or yesterday
  if (dates[0] === todayStr) {
    streak = 1;
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    if (dates[0] === yesterdayStr) {
      streak = 1;
    } else {
      return { streak: 0, loggedToday: false };
    }
  }

  // Count consecutive days from the most recent date
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

  return { streak, loggedToday };
}

async function getDailyFunFact(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const fallback =
    "The average person spends about 3 months of their lifetime on the toilet!";

  // Get count of fun facts
  const { count } = await supabase
    .from("fun_facts")
    .select("*", { count: "exact", head: true });

  if (!count || count === 0) {
    return fallback;
  }

  // Deterministic by day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const offset = dayOfYear % count;

  const { data } = await supabase
    .from("fun_facts")
    .select("fact")
    .order("id", { ascending: true })
    .range(offset, offset)
    .limit(1);

  return data?.[0]?.fact ?? fallback;
}

async function getFriendFeed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<FeedEvent[]> {
  // Get accepted friendships
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!friendships || friendships.length === 0) {
    return [];
  }

  // Extract friend IDs
  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  // Get friend profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name])
  );

  const events: FeedEvent[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  // Get recent logs for friends (one per friend, most recent)
  for (const friendId of friendIds) {
    const name = profileMap.get(friendId) ?? "Someone";

    // Most recent log
    const { data: recentLog } = await supabase
      .from("logs")
      .select("id, logged_at")
      .eq("user_id", friendId)
      .order("logged_at", { ascending: false })
      .limit(1);

    if (recentLog && recentLog.length > 0 && recentLog[0].logged_at >= sevenDaysAgoStr) {
      events.push({
        id: `log-${recentLog[0].id}`,
        text: `${name} logged today`,
        emoji: "\uD83D\uDCA9",
        time: recentLog[0].logged_at,
      });
    }

    // Recent achievements (last 7 days)
    const { data: recentAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", friendId)
      .gte("unlocked_at", sevenDaysAgoStr);

    if (recentAchievements && recentAchievements.length > 0) {
      // Get achievement details
      const achievementIds = recentAchievements.map((a) => a.achievement_id);
      const { data: achievements } = await supabase
        .from("achievements")
        .select("id, name, icon_emoji")
        .in("id", achievementIds);

      const achievementMap = new Map(
        (achievements ?? []).map((a) => [a.id, a])
      );

      for (const ua of recentAchievements) {
        const achievement = achievementMap.get(ua.achievement_id);
        if (achievement) {
          events.push({
            id: `ach-${ua.achievement_id}-${friendId}`,
            text: `${name} unlocked ${achievement.name}`,
            emoji: achievement.icon_emoji ?? "\uD83C\uDFC6",
            time: ua.unlocked_at,
          });
        }
      }
    }
  }

  // Sort by most recent first, limit 20
  events.sort((a, b) => (a.time > b.time ? -1 : 1));
  return events.slice(0, 20);
}
