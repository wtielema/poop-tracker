"use server";

import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  value: number;
  rank: number;
}

export interface ChallengeParticipantData {
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  progress: number;
  joinedAt: string;
}

export interface ChallengeData {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  type: "streak" | "count";
  target: number;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipantData[];
}

// ── Leaderboard ──────────────────────────────────────────────────────

export async function getLeaderboard(
  sortBy: "streak" | "weekly" | "monthly"
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  // Get accepted friends
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  // Include self
  const allUserIds = [user.id, ...friendIds];

  // Get profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji")
    .in("id", allUserIds);

  if (!profiles || profiles.length === 0) return [];

  // Get logs for all users
  const now = new Date();
  let dateFilter: string | null = null;

  if (sortBy === "weekly") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = weekAgo.toISOString();
  } else if (sortBy === "monthly") {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    dateFilter = monthAgo.toISOString();
  }

  // Fetch logs for each user and calculate the metric
  const entries: LeaderboardEntry[] = await Promise.all(
    profiles.map(async (profile) => {
      let query = supabase
        .from("logs")
        .select("logged_at")
        .eq("user_id", profile.id)
        .order("logged_at", { ascending: false });

      if (dateFilter) {
        query = query.gte("logged_at", dateFilter);
      }

      const { data: logs } = await query;
      const logList = logs ?? [];

      let value: number;

      if (sortBy === "streak") {
        value = calculateCurrentStreak(logList);
      } else {
        // weekly or monthly: just count logs
        value = logList.length;
      }

      return {
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarEmoji: profile.avatar_emoji,
        value,
        rank: 0, // Will be set after sorting
      };
    })
  );

  // Sort descending by value
  entries.sort((a, b) => b.value - a.value);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

// ── Challenges ───────────────────────────────────────────────────────

export async function getChallenges(): Promise<{
  active: ChallengeData[];
  completed: ChallengeData[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { active: [], completed: [] };

  // Get challenge IDs where user is a participant
  const { data: participations } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", user.id);

  if (!participations || participations.length === 0) {
    return { active: [], completed: [] };
  }

  const challengeIds = participations.map((p) => p.challenge_id);

  // Get challenges
  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .in("id", challengeIds)
    .order("end_date", { ascending: false });

  if (!challenges || challenges.length === 0) {
    return { active: [], completed: [] };
  }

  // Get all participants for these challenges
  const { data: allParticipants } = await supabase
    .from("challenge_participants")
    .select("challenge_id, user_id, progress, joined_at")
    .in("challenge_id", challengeIds);

  // Get profiles for all participants
  const participantUserIds = [
    ...new Set((allParticipants ?? []).map((p) => p.user_id)),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji")
    .in("id", participantUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const todayStr = new Date().toISOString().substring(0, 10);

  const active: ChallengeData[] = [];
  const completed: ChallengeData[] = [];

  for (const challenge of challenges) {
    const participants: ChallengeParticipantData[] = (allParticipants ?? [])
      .filter((p) => p.challenge_id === challenge.id)
      .map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          userId: p.user_id,
          username: profile?.username ?? "unknown",
          displayName: profile?.display_name ?? "Unknown",
          avatarEmoji: profile?.avatar_emoji ?? "💩",
          progress: p.progress,
          joinedAt: p.joined_at,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    const challengeData: ChallengeData = {
      id: challenge.id,
      creatorId: challenge.creator_id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type as "streak" | "count",
      target: challenge.target,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      participants,
    };

    if (challenge.end_date >= todayStr) {
      active.push(challengeData);
    } else {
      completed.push(challengeData);
    }
  }

  return { active, completed };
}

export async function createChallenge(data: {
  title: string;
  description: string;
  type: "streak" | "count";
  target: number;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Insert the challenge
  const { data: challenge, error: insertError } = await supabase
    .from("challenges")
    .insert({
      creator_id: user.id,
      title: data.title,
      description: data.description || null,
      type: data.type,
      target: data.target,
      start_date: data.startDate,
      end_date: data.endDate,
    })
    .select("id")
    .single();

  if (insertError || !challenge) {
    return { success: false, error: insertError?.message ?? "Failed to create challenge" };
  }

  // Add creator as first participant
  const { error: participantError } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      user_id: user.id,
      progress: 0,
    });

  if (participantError) {
    return { success: false, error: participantError.message };
  }

  return { success: true, challengeId: challenge.id };
}

export async function joinChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if already a participant
  const { data: existing } = await supabase
    .from("challenge_participants")
    .select("user_id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "Already joined this challenge" };
  }

  const { error } = await supabase.from("challenge_participants").insert({
    challenge_id: challengeId,
    user_id: user.id,
    progress: 0,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getChallengeDetail(
  challengeId: string
): Promise<{
  challenge: ChallengeData;
  currentUserId: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Get challenge
  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) return null;

  // Get participants
  const { data: participants } = await supabase
    .from("challenge_participants")
    .select("user_id, progress, joined_at")
    .eq("challenge_id", challengeId);

  const participantUserIds = (participants ?? []).map((p) => p.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji")
    .in("id", participantUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const participantData: ChallengeParticipantData[] = (participants ?? [])
    .map((p) => {
      const profile = profileMap.get(p.user_id);
      return {
        userId: p.user_id,
        username: profile?.username ?? "unknown",
        displayName: profile?.display_name ?? "Unknown",
        avatarEmoji: profile?.avatar_emoji ?? "💩",
        progress: p.progress,
        joinedAt: p.joined_at,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  return {
    challenge: {
      id: challenge.id,
      creatorId: challenge.creator_id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type as "streak" | "count",
      target: challenge.target,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      participants: participantData,
    },
    currentUserId: user.id,
  };
}

// ── Streak Helper ────────────────────────────────────────────────────

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
