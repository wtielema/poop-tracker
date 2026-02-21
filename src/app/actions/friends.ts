"use server";

import { createClient } from "@/lib/supabase/server";

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  // Get IDs of users we're already friends with (either direction)
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const excludeIds = new Set<string>([user.id]);
  for (const f of friendships ?? []) {
    if (f.requester_id === user.id) excludeIds.add(f.addressee_id);
    if (f.addressee_id === user.id) excludeIds.add(f.requester_id);
  }

  const pattern = `%${query.trim()}%`;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji")
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(20);

  if (!profiles) return [];

  // Filter out excluded IDs and limit to 10
  return profiles
    .filter((p) => !excludeIds.has(p.id))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_emoji: p.avatar_emoji,
    }));
}

export async function sendFriendRequest(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  if (userId === user.id) {
    return { success: false, error: "Cannot add yourself" };
  }

  // Check if friendship already exists in either direction
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`
    )
    .limit(1);

  if (existing && existing.length > 0) {
    const status = existing[0].status;
    if (status === "accepted") {
      return { success: false, error: "Already friends" };
    }
    return { success: false, error: "Request already pending" };
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: userId,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeFriend(
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
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

interface FriendProfileStats {
  totalLogs: number;
  currentStreak: number;
  longestStreak: number;
}

interface FriendAchievement {
  slug: string;
  name: string;
  icon_emoji: string;
  description: string;
  unlocked_at: string;
}

interface FriendProfileData {
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_emoji: string;
  };
  isFriend: boolean;
  pendingRequest: boolean;
  stats?: FriendProfileStats;
  achievements?: FriendAchievement[];
}

export async function getFriendProfile(
  username: string
): Promise<FriendProfileData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Get the target profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji, map_visibility")
    .eq("username", username)
    .single();

  if (!profile) return null;

  // Check friendship status
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
    )
    .limit(1);

  const friendshipRecord = friendship?.[0] ?? null;
  const isFriend = friendshipRecord?.status === "accepted";
  const pendingRequest = friendshipRecord?.status === "pending";

  const baseProfile = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_emoji: profile.avatar_emoji,
  };

  if (!isFriend) {
    return {
      profile: baseProfile,
      isFriend: false,
      pendingRequest,
    };
  }

  // Get friend's stats and achievements
  const [logsResult, achievementsResult, userAchievementsResult] =
    await Promise.all([
      supabase
        .from("logs")
        .select("logged_at")
        .eq("user_id", profile.id)
        .order("logged_at", { ascending: false }),
      supabase.from("achievements").select("*").order("id", { ascending: true }),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", profile.id),
    ]);

  const logs = logsResult.data ?? [];
  const totalLogs = logs.length;
  const currentStreak = calculateCurrentStreak(logs);
  const longestStreak = calculateLongestStreak(logs);

  // Build unlocked achievements
  const allAchievements = achievementsResult.data ?? [];
  const userAchievementMap = new Map(
    (userAchievementsResult.data ?? []).map((ua) => [
      ua.achievement_id,
      ua.unlocked_at,
    ])
  );

  const unlockedAchievements: FriendAchievement[] = allAchievements
    .filter((a) => userAchievementMap.has(a.id))
    .map((a) => ({
      slug: a.slug,
      name: a.name,
      icon_emoji: a.icon_emoji,
      description: a.description,
      unlocked_at: userAchievementMap.get(a.id)!,
    }));

  return {
    profile: baseProfile,
    isFriend: true,
    pendingRequest: false,
    stats: { totalLogs, currentStreak, longestStreak },
    achievements: unlockedAchievements,
  };
}

export async function getInviteCode(): Promise<{
  code: string;
  url: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Base64url encode the user ID and truncate to 8 chars
  const code = Buffer.from(user.id)
    .toString("base64url")
    .substring(0, 8);

  // Derive the app URL from env vars
  let appUrl = "http://localhost:3000";
  if (process.env.NEXT_PUBLIC_APP_URL) {
    appUrl = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.VERCEL_URL) {
    appUrl = `https://${process.env.VERCEL_URL}`;
  }

  return {
    code,
    url: `${appUrl}/invite/${code}`,
  };
}

export async function resolveInviteCode(
  code: string
): Promise<{
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
} | null> {
  const supabase = await createClient();

  // Decode the base64url code — we need to find a user whose ID starts with the decoded prefix
  let decoded: string;
  try {
    // Pad the code to make valid base64
    const padded = code + "=".repeat((4 - (code.length % 4)) % 4);
    decoded = Buffer.from(padded, "base64url").toString("utf-8");
  } catch {
    return null;
  }

  if (!decoded || decoded.length < 6) return null;

  // The decoded string is the start of a UUID — query profiles that match
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji")
    .like("id", `${decoded}%`)
    .limit(1);

  if (!profiles || profiles.length === 0) return null;

  const profile = profiles[0];
  return {
    userId: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarEmoji: profile.avatar_emoji,
  };
}

// Streak helpers (duplicated from profile.ts to keep server actions self-contained)

function calculateCurrentStreak(logs: { logged_at: string }[]): number {
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

function calculateLongestStreak(logs: { logged_at: string }[]): number {
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
