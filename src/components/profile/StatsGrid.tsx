import { BRISTOL_SCALE, STREAK_THRESHOLDS } from "@/lib/constants";
import type { BristolScale } from "@/lib/types";

interface StatsGridProps {
  stats: {
    totalLogs: number;
    currentStreak: number;
    longestStreak: number;
    topBristol: { scale: number; count: number } | null;
    avgDuration: number;
    topMood: { emoji: string; count: number } | null;
  };
}

function getStreakFire(streak: number): string {
  const threshold = STREAK_THRESHOLDS.find(
    (t) => streak >= t.min && streak <= t.max
  );
  return threshold?.fires ?? "";
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const bristolInfo = stats.topBristol
    ? BRISTOL_SCALE[stats.topBristol.scale as BristolScale]
    : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Total Logs */}
      <StatCard
        value={`${stats.totalLogs}`}
        emoji="\uD83D\uDCA9"
        label="Total Logs"
      />

      {/* Current Streak */}
      <StatCard
        value={`${stats.currentStreak}`}
        emoji={stats.currentStreak > 0 ? getStreakFire(stats.currentStreak) : "\uD83D\uDD25"}
        label="Current Streak"
      />

      {/* Longest Streak */}
      <StatCard
        value={`${stats.longestStreak}`}
        emoji="\uD83C\uDFC5"
        label="Longest Streak"
      />

      {/* Top Type */}
      <StatCard
        value={bristolInfo ? bristolInfo.label : "--"}
        emoji={bristolInfo ? bristolInfo.emoji : "\u2753"}
        label="Top Type"
      />

      {/* Avg Duration */}
      <StatCard
        value={formatDuration(stats.avgDuration)}
        emoji="\u23F1\uFE0F"
        label="Avg Duration"
      />

      {/* Fav Mood */}
      <StatCard
        value={stats.topMood ? `${stats.topMood.count}x` : "--"}
        emoji={stats.topMood ? stats.topMood.emoji : "\uD83E\uDD37"}
        label="Fav Mood"
      />
    </div>
  );
}

function StatCard({
  value,
  emoji,
  label,
}: {
  value: string;
  emoji: string;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl p-4"
      style={{
        background: "var(--surface)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
      <span
        className="mt-1 font-bold"
        style={{ fontSize: 18, color: "var(--foreground)" }}
      >
        {value}
      </span>
      <span
        className="mt-0.5"
        style={{ fontSize: 12, color: "var(--muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
