"use server";

import { createClient } from "@/lib/supabase/server";
import type { BristolScale, MapVisibility, Mood } from "@/lib/types";

interface ProfileStats {
  totalLogs: number;
  currentStreak: number;
  longestStreak: number;
  topBristol: { scale: number; count: number } | null;
  avgDuration: number;
  topMood: { emoji: string; count: number } | null;
}

interface AchievementWithStatus {
  slug: string;
  name: string;
  icon_emoji: string;
  description: string;
  unlocked_at: string | null;
}

interface FriendInfo {
  username: string;
  display_name: string;
  avatar_emoji: string;
  streak: number;
}

interface PendingRequest {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
}

export interface ProfileData {
  profile: {
    username: string;
    display_name: string;
    avatar_emoji: string;
    map_visibility: MapVisibility;
  };
  stats: ProfileStats;
  achievements: AchievementWithStatus[];
  friends: FriendInfo[];
  pendingRequests: PendingRequest[];
}

export async function getProfileData(): Promise<ProfileData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Run independent queries in parallel
  const [
    profileResult,
    logsResult,
    achievementsResult,
    userAchievementsResult,
    friendshipsResult,
    pendingResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("logs")
      .select("bristol_scale, duration_seconds, mood, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false }),
    supabase.from("achievements").select("*").order("id", { ascending: true }),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id),
    supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    supabase
      .from("friendships")
      .select("id, requester_id")
      .eq("addressee_id", user.id)
      .eq("status", "pending"),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    throw new Error("Profile not found");
  }

  const logs = logsResult.data ?? [];

  // Calculate stats
  const totalLogs = logs.length;
  const currentStreak = calculateCurrentStreak(logs);
  const longestStreak = calculateLongestStreak(logs);
  const topBristol = calculateTopBristol(logs);
  const avgDuration = calculateAvgDuration(logs);
  const topMood = calculateTopMood(logs);

  // Build achievements with unlock status
  const allAchievements = achievementsResult.data ?? [];
  const userAchievementMap = new Map(
    (userAchievementsResult.data ?? []).map((ua) => [
      ua.achievement_id,
      ua.unlocked_at,
    ])
  );

  const achievements: AchievementWithStatus[] = allAchievements.map((a) => ({
    slug: a.slug,
    name: a.name,
    icon_emoji: a.icon_emoji,
    description: a.description,
    unlocked_at: userAchievementMap.get(a.id) ?? null,
  }));

  // Build friends list
  const friendships = friendshipsResult.data ?? [];
  const friendIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  let friends: FriendInfo[] = [];
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_emoji")
      .in("id", friendIds);

    // Calculate streak for each friend
    friends = await Promise.all(
      (friendProfiles ?? []).map(async (fp) => {
        const { data: friendLogs } = await supabase
          .from("logs")
          .select("logged_at")
          .eq("user_id", fp.id)
          .order("logged_at", { ascending: false });

        const streak = calculateCurrentStreak(
          (friendLogs ?? []).map((l) => ({ logged_at: l.logged_at }))
        );

        return {
          username: fp.username,
          display_name: fp.display_name,
          avatar_emoji: fp.avatar_emoji,
          streak,
        };
      })
    );
  }

  // Build pending requests
  let pendingRequests: PendingRequest[] = [];
  const pending = pendingResult.data ?? [];
  if (pending.length > 0) {
    const requesterIds = pending.map((p) => p.requester_id);
    const { data: requesterProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_emoji")
      .in("id", requesterIds);

    const profileMap = new Map(
      (requesterProfiles ?? []).map((p) => [p.id, p])
    );

    pendingRequests = pending
      .map((p) => {
        const rp = profileMap.get(p.requester_id);
        if (!rp) return null;
        return {
          id: p.id,
          username: rp.username,
          display_name: rp.display_name,
          avatar_emoji: rp.avatar_emoji,
        };
      })
      .filter((r): r is PendingRequest => r !== null);
  }

  return {
    profile: {
      username: profile.username,
      display_name: profile.display_name,
      avatar_emoji: profile.avatar_emoji,
      map_visibility: profile.map_visibility,
    },
    stats: {
      totalLogs,
      currentStreak,
      longestStreak,
      topBristol,
      avgDuration,
      topMood,
    },
    achievements,
    friends,
    pendingRequests,
  };
}

export async function updateProfile(data: {
  display_name: string;
  avatar_emoji: string;
  map_visibility: MapVisibility;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.display_name,
      avatar_emoji: data.avatar_emoji,
      map_visibility: data.map_visibility,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function acceptFriendRequest(
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function declineFriendRequest(
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Helper functions

function calculateCurrentStreak(
  logs: { logged_at: string }[]
): number {
  if (logs.length === 0) return 0;

  const dates = [
    ...new Set(logs.map((l) => l.logged_at.substring(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);

  let streak = 0;

  if (dates[0] === todayStr) {
    streak = 1;
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    if (dates[0] === yesterdayStr) {
      streak = 1;
    } else {
      return 0;
    }
  }

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

function calculateLongestStreak(
  logs: { logged_at: string }[]
): number {
  if (logs.length === 0) return 0;

  const dates = [
    ...new Set(logs.map((l) => l.logged_at.substring(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  let longest = 1;
  let current = 1;

  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i]);
    const d2 = new Date(dates[i + 1]);
    const diffMs = d1.getTime() - d2.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function calculateTopBristol(
  logs: { bristol_scale: BristolScale }[]
): { scale: number; count: number } | null {
  if (logs.length === 0) return null;

  const counts = new Map<number, number>();
  for (const log of logs) {
    counts.set(log.bristol_scale, (counts.get(log.bristol_scale) ?? 0) + 1);
  }

  let topScale = 0;
  let topCount = 0;
  for (const [scale, count] of counts) {
    if (count > topCount) {
      topScale = scale;
      topCount = count;
    }
  }

  return { scale: topScale, count: topCount };
}

function calculateAvgDuration(
  logs: { duration_seconds: number }[]
): number {
  if (logs.length === 0) return 0;

  const total = logs.reduce((sum, l) => sum + l.duration_seconds, 0);
  return Math.round(total / logs.length);
}

function calculateTopMood(
  logs: { mood: Mood }[]
): { emoji: string; count: number } | null {
  if (logs.length === 0) return null;

  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.mood, (counts.get(log.mood) ?? 0) + 1);
  }

  let topEmoji = "";
  let topCount = 0;
  for (const [emoji, count] of counts) {
    if (count > topCount) {
      topEmoji = emoji;
      topCount = count;
    }
  }

  return { emoji: topEmoji, count: topCount };
}
