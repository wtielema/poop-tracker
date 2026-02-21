/**
 * Pure streak calculation functions.
 * Extracted from server actions so they can be tested without DB dependencies.
 */

/**
 * Calculate current streak from an array of log dates (ISO strings).
 * Dates do not need to be sorted or deduplicated — this function handles it.
 * A streak counts consecutive days with at least one log, going back from today.
 * "Yesterday but not today" still counts as a streak of 1.
 */
export function calculateStreak(logDates: string[], today?: Date): number {
  if (logDates.length === 0) return 0;

  const refDate = today ?? new Date();

  // Extract unique date strings (YYYY-MM-DD) and sort descending
  const dates = [
    ...new Set(logDates.map((d) => d.substring(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  const todayStr = refDate.toISOString().substring(0, 10);

  let streak = 0;

  // Check if most recent log is today or yesterday
  if (dates[0] === todayStr) {
    streak = 1;
  } else {
    const yesterday = new Date(refDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    if (dates[0] === yesterdayStr) {
      streak = 1;
    } else {
      return 0;
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

  return streak;
}

/**
 * Calculate the longest streak ever from log dates.
 * Finds the longest run of consecutive days anywhere in the date list.
 */
export function calculateLongestStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0;

  // Extract unique date strings and sort descending
  const dates = [
    ...new Set(logDates.map((d) => d.substring(0, 10))),
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
