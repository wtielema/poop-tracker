"use client";

import { useState } from "react";

interface AchievementItem {
  slug: string;
  name: string;
  icon_emoji: string;
  description: string;
  unlocked_at: string | null;
}

interface AchievementGridProps {
  achievements: AchievementItem[];
}

function daysAgo(dateStr: string): string {
  const unlocked = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - unlocked.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default function AchievementGrid({
  achievements,
}: AchievementGridProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked_at).length;
  const totalCount = achievements.length;

  const selected = achievements.find((a) => a.slug === selectedSlug);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="font-bold"
          style={{ fontSize: 18, color: "var(--foreground)" }}
        >
          Achievements
        </h2>
        <span
          className="font-semibold"
          style={{ fontSize: 14, color: "var(--muted)" }}
        >
          {unlockedCount}/{totalCount}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((achievement) => {
          const unlocked = !!achievement.unlocked_at;
          return (
            <button
              key={achievement.slug}
              type="button"
              onClick={() => {
                if (unlocked) {
                  setSelectedSlug(
                    selectedSlug === achievement.slug ? null : achievement.slug
                  );
                }
              }}
              className="flex flex-col items-center rounded-xl p-3 transition-all"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                opacity: unlocked ? 1 : 0.4,
                cursor: unlocked ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  lineHeight: 1,
                  filter: unlocked ? "none" : "grayscale(100%)",
                }}
              >
                {unlocked ? achievement.icon_emoji : "🔒"}
              </span>
              <span
                className="mt-1 text-center font-medium leading-tight"
                style={{
                  fontSize: 11,
                  color: unlocked ? "var(--foreground)" : "var(--muted)",
                }}
              >
                {unlocked ? achievement.name : "???"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Popover for selected achievement */}
      {selected && selected.unlocked_at && (
        <div
          className="mt-3 rounded-xl p-4"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--accent)",
            boxShadow: "0 4px 12px rgba(245, 197, 66, 0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 36, lineHeight: 1 }}>
              {selected.icon_emoji}
            </span>
            <div className="flex-1">
              <div
                className="font-bold"
                style={{ fontSize: 15, color: "var(--foreground)" }}
              >
                {selected.name}
              </div>
              <div
                className="mt-0.5"
                style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}
              >
                {selected.description}
              </div>
              <div
                className="mt-1 font-medium"
                style={{ fontSize: 12, color: "var(--accent-dim)" }}
              >
                Unlocked {daysAgo(selected.unlocked_at)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              style={{ color: "var(--muted)", fontSize: 18 }}
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
