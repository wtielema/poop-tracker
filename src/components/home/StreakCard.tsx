"use client";

import { STREAK_THRESHOLDS } from "@/lib/constants";

interface StreakCardProps {
  streak: number;
  loggedToday: boolean;
}

function getStreakInfo(streak: number) {
  return (
    STREAK_THRESHOLDS.find((t) => streak >= t.min && streak <= t.max) ??
    STREAK_THRESHOLDS[0]
  );
}

function getFireAnimationClass(streak: number): string {
  if (streak >= 100) return "animate-fire-rapid animate-fire-glow";
  if (streak >= 30) return "animate-fire-fast";
  if (streak >= 7) return "animate-fire-medium";
  return "animate-fire-slow";
}

export default function StreakCard({ streak, loggedToday }: StreakCardProps) {
  const streakInfo = getStreakInfo(streak);
  const fireClass = getFireAnimationClass(streak);

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--surface-shadow)",
      }}
    >
      {streak > 0 && (
        <div className={fireClass} style={{ fontSize: 36 }}>
          {streakInfo.fires}
        </div>
      )}

      <div
        className="mt-1 font-bold"
        style={{ fontSize: 48, color: "var(--primary)", lineHeight: 1.1 }}
      >
        {streak}
      </div>

      <div
        className="mt-1 font-semibold"
        style={{ fontSize: 14, color: "var(--muted)" }}
      >
        {streak === 1 ? "day streak" : "day streak"}
      </div>

      {streak > 0 && (
        <div
          className="mt-1 font-bold"
          style={{ fontSize: 13, color: "var(--accent-dim)" }}
        >
          {streakInfo.label}
        </div>
      )}

      {!loggedToday && (
        <div
          className="mt-3 font-semibold"
          style={{ fontSize: 14, color: "var(--accent-dim)" }}
        >
          {streak === 0
            ? "Start your streak today!"
            : "Log today to keep your streak! 💪"}
        </div>
      )}
    </div>
  );
}
