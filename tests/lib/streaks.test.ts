import { describe, it, expect } from "vitest";
import { calculateStreak, calculateLongestStreak } from "@/lib/streaks";

/**
 * Helper: generate an ISO date string for a given number of days ago
 * relative to a reference date, at a specific hour (UTC).
 */
function daysAgo(n: number, ref: Date, hour = 12): string {
  const d = new Date(ref);
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe("calculateStreak", () => {
  // Use a fixed reference date for deterministic tests
  const today = new Date("2026-02-21T12:00:00.000Z");

  it("returns 0 when there are no logs", () => {
    expect(calculateStreak([], today)).toBe(0);
  });

  it("returns 1 when there is one log today", () => {
    const logs = [daysAgo(0, today)];
    expect(calculateStreak(logs, today)).toBe(1);
  });

  it("returns 2 when there are logs today and yesterday", () => {
    const logs = [daysAgo(0, today), daysAgo(1, today)];
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it("returns 3 for 3 consecutive days", () => {
    const logs = [daysAgo(0, today), daysAgo(1, today), daysAgo(2, today)];
    expect(calculateStreak(logs, today)).toBe(3);
  });

  it("returns 1 when there is a gap (today and 2 days ago, no yesterday)", () => {
    const logs = [daysAgo(0, today), daysAgo(2, today)];
    expect(calculateStreak(logs, today)).toBe(1);
  });

  it("counts multiple logs on the same day as 1 day", () => {
    const logs = [
      daysAgo(0, today, 8),
      daysAgo(0, today, 12),
      daysAgo(0, today, 18),
    ];
    expect(calculateStreak(logs, today)).toBe(1);
  });

  it("returns 1 when most recent log is yesterday (not today)", () => {
    const logs = [daysAgo(1, today)];
    expect(calculateStreak(logs, today)).toBe(1);
  });

  it("returns 2 when most recent is yesterday and day before also has a log", () => {
    const logs = [daysAgo(1, today), daysAgo(2, today)];
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it("returns 0 when most recent log is 2 days ago (streak broken)", () => {
    const logs = [daysAgo(2, today)];
    expect(calculateStreak(logs, today)).toBe(0);
  });

  it("handles a long streak of 30 consecutive days", () => {
    const logs = Array.from({ length: 30 }, (_, i) => daysAgo(i, today));
    expect(calculateStreak(logs, today)).toBe(30);
  });

  it("handles logs near midnight correctly (same UTC date)", () => {
    // Two logs on the same day: one at 23:59 and one at 00:01
    const logs = [
      "2026-02-21T23:59:00.000Z",
      "2026-02-21T00:01:00.000Z",
      "2026-02-20T12:00:00.000Z",
    ];
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it("handles unsorted input correctly", () => {
    // Dates out of order
    const logs = [daysAgo(2, today), daysAgo(0, today), daysAgo(1, today)];
    expect(calculateStreak(logs, today)).toBe(3);
  });
});

describe("calculateLongestStreak", () => {
  const today = new Date("2026-02-21T12:00:00.000Z");

  it("returns 0 when there are no logs", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it("returns 1 for a single log", () => {
    expect(calculateLongestStreak(["2026-02-21T12:00:00.000Z"])).toBe(1);
  });

  it("finds the longest run even if not the most recent", () => {
    // Old streak of 5 days, then a gap, then recent streak of 2 days
    const logs = [
      // Recent 2-day streak
      daysAgo(0, today),
      daysAgo(1, today),
      // Gap (skip day 2)
      // Old 5-day streak
      daysAgo(3, today),
      daysAgo(4, today),
      daysAgo(5, today),
      daysAgo(6, today),
      daysAgo(7, today),
    ];
    expect(calculateLongestStreak(logs)).toBe(5);
  });

  it("handles multiple logs on the same day", () => {
    const logs = [
      daysAgo(0, today, 8),
      daysAgo(0, today, 14),
      daysAgo(1, today, 10),
    ];
    expect(calculateLongestStreak(logs)).toBe(2);
  });

  it("returns correct streak when entire history is consecutive", () => {
    const logs = Array.from({ length: 10 }, (_, i) => daysAgo(i, today));
    expect(calculateLongestStreak(logs)).toBe(10);
  });

  it("handles two streaks of equal length", () => {
    // Two separate 3-day streaks
    const logs = [
      daysAgo(0, today),
      daysAgo(1, today),
      daysAgo(2, today),
      // gap
      daysAgo(5, today),
      daysAgo(6, today),
      daysAgo(7, today),
    ];
    expect(calculateLongestStreak(logs)).toBe(3);
  });
});
