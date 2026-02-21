import { describe, it, expect } from "vitest";
import { checkAchievements, type AchievementContext } from "@/lib/achievements";

/**
 * Factory function to create a default AchievementContext.
 * Override any fields as needed for each test.
 */
function makeCtx(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    totalLogs: 0,
    currentStreak: 0,
    latestLog: {
      bristol_scale: 4,
      duration_seconds: 180,
      logged_at: "2026-02-21T14:00:00.000Z", // 2pm UTC, a safe daytime hour
      lat: null,
      lng: null,
    },
    allBristolTypes: [4],
    friendCount: 0,
    completedChallenges: 0,
    logTimes: [],
    uniqueLocations: 0,
    existingAchievements: [],
    ...overrides,
  };
}

describe("checkAchievements", () => {
  // ── first_drop ──────────────────────────────────────────────────────────
  describe("first_drop", () => {
    it("should earn first_drop when totalLogs >= 1", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 1 }));
      expect(result).toContain("first_drop");
    });

    it("should NOT earn first_drop when totalLogs is 0", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 0 }));
      expect(result).not.toContain("first_drop");
    });
  });

  // ── regular ─────────────────────────────────────────────────────────────
  describe("regular", () => {
    it("should earn regular when streak is 7", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 7, currentStreak: 7 }));
      expect(result).toContain("regular");
    });

    it("should NOT earn regular when streak is 6", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 6, currentStreak: 6 }));
      expect(result).not.toContain("regular");
    });
  });

  // ── iron_bowel ──────────────────────────────────────────────────────────
  describe("iron_bowel", () => {
    it("should earn iron_bowel when streak is 30", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 30, currentStreak: 30 }));
      expect(result).toContain("iron_bowel");
    });

    it("should NOT earn iron_bowel when streak is 29", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 29, currentStreak: 29 }));
      expect(result).not.toContain("iron_bowel");
    });
  });

  // ── centurion ───────────────────────────────────────────────────────────
  describe("centurion", () => {
    it("should earn centurion when streak is 100", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 100, currentStreak: 100 }));
      expect(result).toContain("centurion");
    });

    it("should NOT earn centurion when streak is 99", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 99, currentStreak: 99 }));
      expect(result).not.toContain("centurion");
    });
  });

  // ── speed_demon ─────────────────────────────────────────────────────────
  describe("speed_demon", () => {
    it("should earn speed_demon when duration is 59 seconds", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 59,
            logged_at: "2026-02-21T14:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("speed_demon");
    });

    it("should NOT earn speed_demon when duration is 60 seconds", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 60,
            logged_at: "2026-02-21T14:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).not.toContain("speed_demon");
    });
  });

  // ── marathon_sitter ─────────────────────────────────────────────────────
  describe("marathon_sitter", () => {
    it("should earn marathon_sitter when duration is 1201 seconds", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 1201,
            logged_at: "2026-02-21T14:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("marathon_sitter");
    });

    it("should NOT earn marathon_sitter when duration is 1200 seconds", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 1200,
            logged_at: "2026-02-21T14:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).not.toContain("marathon_sitter");
    });
  });

  // ── perfect_week ────────────────────────────────────────────────────────
  describe("perfect_week", () => {
    it("should earn perfect_week when logs cover all 7 days of the week", () => {
      // 2026-02-16 is Monday, 2026-02-22 is Sunday
      const logTimes = [
        "2026-02-16T08:00:00.000Z", // Mon
        "2026-02-17T08:00:00.000Z", // Tue
        "2026-02-18T08:00:00.000Z", // Wed
        "2026-02-19T08:00:00.000Z", // Thu
        "2026-02-20T08:00:00.000Z", // Fri
        "2026-02-21T08:00:00.000Z", // Sat
        "2026-02-22T08:00:00.000Z", // Sun
      ];
      const result = checkAchievements(
        makeCtx({
          totalLogs: 7,
          currentStreak: 7,
          logTimes,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-22T08:00:00.000Z", // Sunday
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("perfect_week");
    });

    it("should NOT earn perfect_week when one day is missing", () => {
      // Missing Thursday
      const logTimes = [
        "2026-02-16T08:00:00.000Z", // Mon
        "2026-02-17T08:00:00.000Z", // Tue
        "2026-02-18T08:00:00.000Z", // Wed
        // no Thu
        "2026-02-20T08:00:00.000Z", // Fri
        "2026-02-21T08:00:00.000Z", // Sat
        "2026-02-22T08:00:00.000Z", // Sun
      ];
      const result = checkAchievements(
        makeCtx({
          totalLogs: 6,
          currentStreak: 6,
          logTimes,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-22T08:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).not.toContain("perfect_week");
    });
  });

  // ── variety_pack ────────────────────────────────────────────────────────
  describe("variety_pack", () => {
    it("should earn variety_pack when 7 distinct Bristol types logged", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 7,
          allBristolTypes: [1, 2, 3, 4, 5, 6, 7],
        })
      );
      expect(result).toContain("variety_pack");
    });

    it("should NOT earn variety_pack when only 6 distinct types", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 6,
          allBristolTypes: [1, 2, 3, 4, 5, 6],
        })
      );
      expect(result).not.toContain("variety_pack");
    });
  });

  // ── social_butterfly ───────────────────────────────────────────────────
  describe("social_butterfly", () => {
    it("should earn social_butterfly when friendCount >= 5", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 1, friendCount: 5 }));
      expect(result).toContain("social_butterfly");
    });

    it("should NOT earn social_butterfly when friendCount < 5", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 1, friendCount: 4 }));
      expect(result).not.toContain("social_butterfly");
    });
  });

  // ── challenger ──────────────────────────────────────────────────────────
  describe("challenger", () => {
    it("should earn challenger when completedChallenges >= 1", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 1, completedChallenges: 1 }));
      expect(result).toContain("challenger");
    });

    it("should NOT earn challenger when completedChallenges is 0", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 1, completedChallenges: 0 }));
      expect(result).not.toContain("challenger");
    });
  });

  // ── night_owl ───────────────────────────────────────────────────────────
  describe("night_owl", () => {
    it("should earn night_owl when log is at 3am", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-21T03:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("night_owl");
    });

    it("should NOT earn night_owl when log is at 6am", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-21T06:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).not.toContain("night_owl");
    });

    it("should earn night_owl at midnight (0:00)", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-21T00:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("night_owl");
    });

    it("should earn night_owl at 4:59am", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-21T04:59:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("night_owl");
    });

    it("should NOT earn night_owl at 5:00am", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 180,
            logged_at: "2026-02-21T05:00:00.000Z",
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).not.toContain("night_owl");
    });
  });

  // ── creature_of_habit ──────────────────────────────────────────────────
  describe("creature_of_habit", () => {
    it("should earn creature_of_habit when 7 logs are all within 30 minutes of each other", () => {
      // All logs between 8:00 and 8:25
      const logTimes = [
        "2026-02-15T08:00:00.000Z",
        "2026-02-16T08:05:00.000Z",
        "2026-02-17T08:10:00.000Z",
        "2026-02-18T08:15:00.000Z",
        "2026-02-19T08:20:00.000Z",
        "2026-02-20T08:25:00.000Z",
        "2026-02-21T08:30:00.000Z",
      ];
      const result = checkAchievements(
        makeCtx({ totalLogs: 7, logTimes })
      );
      expect(result).toContain("creature_of_habit");
    });

    it("should NOT earn creature_of_habit when one log is far off", () => {
      const logTimes = [
        "2026-02-15T08:00:00.000Z",
        "2026-02-16T08:05:00.000Z",
        "2026-02-17T08:10:00.000Z",
        "2026-02-18T08:15:00.000Z",
        "2026-02-19T08:20:00.000Z",
        "2026-02-20T08:25:00.000Z",
        "2026-02-21T14:00:00.000Z", // 2pm - way off
      ];
      const result = checkAchievements(
        makeCtx({ totalLogs: 7, logTimes })
      );
      expect(result).not.toContain("creature_of_habit");
    });

    it("should NOT earn creature_of_habit with fewer than 7 logs", () => {
      const logTimes = [
        "2026-02-16T08:00:00.000Z",
        "2026-02-17T08:05:00.000Z",
        "2026-02-18T08:10:00.000Z",
        "2026-02-19T08:15:00.000Z",
        "2026-02-20T08:20:00.000Z",
        "2026-02-21T08:25:00.000Z",
      ];
      const result = checkAchievements(
        makeCtx({ totalLogs: 6, logTimes })
      );
      expect(result).not.toContain("creature_of_habit");
    });

    it("should handle midnight wrapping (23:50 and 00:10)", () => {
      const logTimes = [
        "2026-02-15T23:50:00.000Z",
        "2026-02-16T23:55:00.000Z",
        "2026-02-17T00:00:00.000Z",
        "2026-02-18T00:05:00.000Z",
        "2026-02-19T00:10:00.000Z",
        "2026-02-20T23:50:00.000Z",
        "2026-02-21T00:05:00.000Z",
      ];
      const result = checkAchievements(
        makeCtx({ totalLogs: 7, logTimes })
      );
      expect(result).toContain("creature_of_habit");
    });
  });

  // ── globe_trotter ──────────────────────────────────────────────────────
  describe("globe_trotter", () => {
    it("should earn globe_trotter when uniqueLocations >= 3", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 3, uniqueLocations: 3 }));
      expect(result).toContain("globe_trotter");
    });

    it("should NOT earn globe_trotter when uniqueLocations < 3", () => {
      const result = checkAchievements(makeCtx({ totalLogs: 2, uniqueLocations: 2 }));
      expect(result).not.toContain("globe_trotter");
    });
  });

  // ── Already earned achievements ────────────────────────────────────────
  describe("already earned achievements", () => {
    it("should NOT return achievements that are already earned", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          existingAchievements: ["first_drop"],
        })
      );
      expect(result).not.toContain("first_drop");
    });

    it("should return only NEW achievements when some are already earned", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          currentStreak: 7,
          existingAchievements: ["first_drop"],
        })
      );
      expect(result).not.toContain("first_drop");
      expect(result).toContain("regular");
    });

    it("should return empty array when all matching achievements are already earned", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          existingAchievements: ["first_drop"],
        })
      );
      // first_drop would match but is already earned, nothing else qualifies
      expect(result).toEqual([]);
    });
  });

  // ── Multiple achievements at once ──────────────────────────────────────
  describe("multiple achievements", () => {
    it("should return multiple new achievements when multiple criteria are met", () => {
      const result = checkAchievements(
        makeCtx({
          totalLogs: 1,
          currentStreak: 7,
          latestLog: {
            bristol_scale: 4,
            duration_seconds: 30, // speed_demon
            logged_at: "2026-02-21T02:00:00.000Z", // night_owl (2am)
            lat: null,
            lng: null,
          },
        })
      );
      expect(result).toContain("first_drop");
      expect(result).toContain("regular");
      expect(result).toContain("speed_demon");
      expect(result).toContain("night_owl");
    });
  });
});
