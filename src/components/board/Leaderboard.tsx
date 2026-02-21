"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getLeaderboard,
  type LeaderboardEntry,
} from "@/app/actions/challenges";
import { getRandomFact } from "@/lib/fun-facts";

type SortBy = "streak" | "weekly" | "monthly";

interface LeaderboardProps {
  initialData: LeaderboardEntry[];
  currentUserId: string;
}

const TABS: { key: SortBy; label: string }[] = [
  { key: "streak", label: "Streak 🔥" },
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
];

function getRankDisplay(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function getRankChangeArrow(
  userId: string,
  currentRank: number,
  sortBy: SortBy
): string {
  if (typeof window === "undefined") return "";

  try {
    const stored = localStorage.getItem(`leaderboard_ranks_${sortBy}`);
    if (!stored) return "";

    const prevRanks: Record<string, number> = JSON.parse(stored);
    const prevRank = prevRanks[userId];
    if (prevRank === undefined) return "";

    if (currentRank < prevRank) return " ↑";
    if (currentRank > prevRank) return " ↓";
  } catch {
    // Ignore parse errors
  }

  return "";
}

function storeRanks(entries: LeaderboardEntry[], sortBy: SortBy) {
  if (typeof window === "undefined") return;

  try {
    const ranks: Record<string, number> = {};
    for (const entry of entries) {
      ranks[entry.userId] = entry.rank;
    }
    localStorage.setItem(`leaderboard_ranks_${sortBy}`, JSON.stringify(ranks));
  } catch {
    // Ignore storage errors
  }
}

export default function Leaderboard({
  initialData,
  currentUserId,
}: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortBy>("streak");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Store initial ranks
    storeRanks(initialData, "streak");
  }, [initialData]);

  function handleToggle(newSortBy: SortBy) {
    if (newSortBy === sortBy) return;

    setSortBy(newSortBy);
    startTransition(async () => {
      const data = await getLeaderboard(newSortBy);
      setEntries(data);
      storeRanks(data, newSortBy);
    });
  }

  if (entries.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 48 }}>{"🏆"}</div>
        <p
          className="mt-3 font-medium"
          style={{ fontSize: 15, color: "var(--muted)" }}
        >
          Add friends to see the leaderboard! {"🏆"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Toggle */}
      <div
        className="flex gap-1 rounded-full p-1"
        style={{ background: "var(--background)", border: "1px solid var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleToggle(tab.key)}
            className="flex-1 rounded-full py-2 text-center font-semibold transition-all"
            style={{
              fontSize: 13,
              background:
                sortBy === tab.key ? "var(--accent)" : "transparent",
              color:
                sortBy === tab.key ? "var(--foreground)" : "var(--muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading indicator with fun fact */}
      {isPending && (
        <div
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(245, 197, 66, 0.1)",
            border: "1px solid rgba(245, 197, 66, 0.25)",
          }}
        >
          <div
            className="mb-1 font-bold"
            style={{ fontSize: 13, color: "var(--accent-dim)" }}
          >
            {"💡"} Did you know?
          </div>
          <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>
            {getRandomFact()}
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-2" style={{ opacity: isPending ? 0.5 : 1 }}>
        {entries.map((entry) => {
          const isMe = entry.userId === currentUserId;
          const rankDisplay = getRankDisplay(entry.rank);
          const arrow = mounted
            ? getRankChangeArrow(entry.userId, entry.rank, sortBy)
            : "";

          return (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: isMe ? "var(--accent)" : "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                border: isMe ? "2px solid var(--accent)" : "none",
              }}
            >
              {/* Rank */}
              <div
                className="flex items-center justify-center font-bold"
                style={{
                  width: 32,
                  height: 32,
                  fontSize: entry.rank <= 3 ? 20 : 16,
                  color: "var(--foreground)",
                }}
              >
                {rankDisplay}
              </div>

              {/* Avatar + Name */}
              <span style={{ fontSize: 28, lineHeight: 1 }}>
                {entry.avatarEmoji}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate"
                  style={{ fontSize: 14, color: "var(--foreground)" }}
                >
                  {entry.displayName}
                  {isMe && (
                    <span
                      className="ml-1"
                      style={{ fontSize: 12, color: "var(--muted)" }}
                    >
                      (you)
                    </span>
                  )}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 12, color: "var(--muted)" }}
                >
                  @{entry.username}
                </div>
              </div>

              {/* Value + Arrow */}
              <div
                className="font-bold flex items-center gap-1"
                style={{ fontSize: 18, color: "var(--foreground)" }}
              >
                <span>{entry.value}</span>
                {sortBy === "streak" && entry.value > 0 && (
                  <span style={{ fontSize: 14 }}>{"🔥"}</span>
                )}
                {arrow && (
                  <span
                    style={{
                      fontSize: 14,
                      color: arrow.includes("↑")
                        ? "var(--success)"
                        : "#e74c3c",
                    }}
                  >
                    {arrow.trim()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
