/**
 * Pure achievement checking logic.
 * No DB calls — takes context data and returns newly earned achievement slugs.
 */

export interface AchievementContext {
  totalLogs: number;
  currentStreak: number;
  latestLog: {
    bristol_scale: number;
    duration_seconds: number;
    logged_at: string; // ISO timestamp
    lat: number | null;
    lng: number | null;
  };
  allBristolTypes: number[]; // distinct bristol_scale values the user has logged
  friendCount: number;
  completedChallenges: number;
  logTimes: string[]; // ISO timestamps of last 7 logs for "creature of habit" check
  uniqueLocations: number; // count of distinct cities/areas (approximated by rounding lat/lng to 1 decimal)
  existingAchievements: string[]; // slugs already unlocked
}

type AchievementCheck = (ctx: AchievementContext) => boolean;

const ACHIEVEMENT_CHECKS: Record<string, AchievementCheck> = {
  first_drop: (ctx) => ctx.totalLogs >= 1,

  regular: (ctx) => ctx.currentStreak >= 7,

  iron_bowel: (ctx) => ctx.currentStreak >= 30,

  centurion: (ctx) => ctx.currentStreak >= 100,

  speed_demon: (ctx) => ctx.latestLog.duration_seconds < 60,

  marathon_sitter: (ctx) => ctx.latestLog.duration_seconds > 1200,

  perfect_week: (ctx) => {
    // Check if user has logged every day Mon-Sun in the current week
    // We derive the current week from the latest log's date (using UTC)
    const logDate = new Date(ctx.latestLog.logged_at);

    // Get the Monday of the current week (ISO week: Mon=1, Sun=7)
    const dayOfWeek = logDate.getUTCDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(Date.UTC(
      logDate.getUTCFullYear(),
      logDate.getUTCMonth(),
      logDate.getUTCDate() - diffToMonday,
    ));

    // Generate all 7 days of this week as YYYY-MM-DD strings
    const weekDays = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      weekDays.add(d.toISOString().substring(0, 10));
    }

    // Collect unique dates from logTimes (using UTC date part from ISO string)
    const logDates = new Set(
      ctx.logTimes.map((t) => t.substring(0, 10))
    );

    // Check if all 7 week days are covered
    for (const day of weekDays) {
      if (!logDates.has(day)) return false;
    }
    return true;
  },

  variety_pack: (ctx) => ctx.allBristolTypes.length >= 7,

  social_butterfly: (ctx) => ctx.friendCount >= 5,

  challenger: (ctx) => ctx.completedChallenges >= 1,

  night_owl: (ctx) => {
    const hour = new Date(ctx.latestLog.logged_at).getUTCHours();
    return hour >= 0 && hour < 5;
  },

  creature_of_habit: (ctx) => {
    if (ctx.logTimes.length < 7) return false;

    // Get the 7 most recent log times
    const recentTimes = ctx.logTimes.slice(0, 7);

    // Extract the minute-of-day for each log (UTC)
    const minutesOfDay = recentTimes.map((t) => {
      const d = new Date(t);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    });

    // Check if all are within 30 minutes of each other
    // Find min and max, they must differ by at most 30 minutes
    // But we must handle midnight wrapping (e.g., 23:50 and 00:10)
    const sorted = [...minutesOfDay].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Direct range check
    if (max - min <= 30) return true;

    // Check with midnight wrapping: shift all times by 720 minutes (12 hours) and re-check
    const shifted = sorted.map((m) => (m + 720) % 1440);
    const shiftedSorted = [...shifted].sort((a, b) => a - b);
    const shiftedMin = shiftedSorted[0];
    const shiftedMax = shiftedSorted[shiftedSorted.length - 1];

    return shiftedMax - shiftedMin <= 30;
  },

  globe_trotter: (ctx) => ctx.uniqueLocations >= 3,
};

/**
 * Check which achievements the user has newly earned.
 * Returns an array of achievement slugs that are newly unlocked.
 */
export function checkAchievements(ctx: AchievementContext): string[] {
  const existingSet = new Set(ctx.existingAchievements);
  const newlyEarned: string[] = [];

  for (const [slug, check] of Object.entries(ACHIEVEMENT_CHECKS)) {
    if (existingSet.has(slug)) continue;

    if (check(ctx)) {
      newlyEarned.push(slug);
    }
  }

  return newlyEarned;
}

/**
 * All known achievement slugs for reference.
 */
export const ACHIEVEMENT_SLUGS = Object.keys(ACHIEVEMENT_CHECKS);
