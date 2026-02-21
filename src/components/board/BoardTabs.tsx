"use client";

import { useState } from "react";
import Leaderboard from "./Leaderboard";
import ChallengeList from "./ChallengeList";
import type { LeaderboardEntry, ChallengeData } from "@/app/actions/challenges";

type Tab = "leaderboard" | "challenges";

interface BoardTabsProps {
  leaderboardData: LeaderboardEntry[];
  challengeData: {
    active: ChallengeData[];
    completed: ChallengeData[];
  };
  currentUserId: string;
}

export default function BoardTabs({
  leaderboardData,
  challengeData,
  currentUserId,
}: BoardTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div
        className="flex gap-1 rounded-full p-1"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className="flex-1 rounded-full py-2.5 text-center font-bold transition-all"
          style={{
            fontSize: 14,
            background:
              activeTab === "leaderboard" ? "var(--accent)" : "transparent",
            color:
              activeTab === "leaderboard"
                ? "var(--foreground)"
                : "var(--muted)",
          }}
        >
          Leaderboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("challenges")}
          className="flex-1 rounded-full py-2.5 text-center font-bold transition-all"
          style={{
            fontSize: 14,
            background:
              activeTab === "challenges" ? "var(--accent)" : "transparent",
            color:
              activeTab === "challenges"
                ? "var(--foreground)"
                : "var(--muted)",
          }}
        >
          Challenges
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "leaderboard" ? (
        <Leaderboard
          initialData={leaderboardData}
          currentUserId={currentUserId}
        />
      ) : (
        <ChallengeList
          challenges={challengeData}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
