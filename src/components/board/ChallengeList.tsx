"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChallengeData } from "@/app/actions/challenges";
import CreateChallenge from "./CreateChallenge";

interface ChallengeListProps {
  challenges: {
    active: ChallengeData[];
    completed: ChallengeData[];
  };
  currentUserId: string;
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getMyProgress(
  challenge: ChallengeData,
  currentUserId: string
): number {
  const me = challenge.participants.find((p) => p.userId === currentUserId);
  return me?.progress ?? 0;
}

export default function ChallengeList({
  challenges,
  currentUserId,
}: ChallengeListProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="space-y-4">
      {/* Active Challenges Header */}
      <h2
        className="font-bold"
        style={{ fontSize: 18, color: "var(--foreground)" }}
      >
        Active Challenges
      </h2>

      {/* Active Challenge Cards */}
      {challenges.active.length > 0 ? (
        <div className="space-y-3">
          {challenges.active.map((challenge) => {
            const daysLeft = getDaysRemaining(challenge.endDate);
            const myProgress = getMyProgress(challenge, currentUserId);
            const progressPct = Math.min(
              100,
              (myProgress / challenge.target) * 100
            );

            return (
              <button
                key={challenge.id}
                type="button"
                onClick={() => router.push(`/board/challenge/${challenge.id}`)}
                className="w-full rounded-xl p-4 text-left transition-all active:scale-[0.98]"
                style={{
                  background: "var(--surface)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="font-bold truncate"
                    style={{ fontSize: 15, color: "var(--foreground)" }}
                  >
                    {challenge.title}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      fontSize: 11,
                      background:
                        challenge.type === "streak"
                          ? "var(--accent)"
                          : "var(--background)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {challenge.type === "streak" ? "Streak" : "Count"} ·{" "}
                    {challenge.target}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span
                      className="font-semibold"
                      style={{ fontSize: 12, color: "var(--muted)" }}
                    >
                      {myProgress} / {challenge.target}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ fontSize: 12, color: "var(--muted)" }}
                    >
                      {daysLeft} {daysLeft === 1 ? "day" : "days"} left
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="mt-2 font-medium"
                  style={{ fontSize: 12, color: "var(--muted)" }}
                >
                  {challenge.participants.length}{" "}
                  {challenge.participants.length === 1
                    ? "participant"
                    : "participants"}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        !showCreate && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "var(--surface)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 40 }}>{"🎯"}</div>
            <p
              className="mt-2 font-medium"
              style={{ fontSize: 14, color: "var(--muted)" }}
            >
              No challenges yet. Create one and invite friends! {"🎯"}
            </p>
          </div>
        )
      )}

      {/* Create Challenge Button / Form */}
      {showCreate ? (
        <CreateChallenge onClose={() => setShowCreate(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="w-full rounded-xl py-3 text-center font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "var(--primary)",
            color: "#FFFFFF",
            fontSize: 14,
          }}
        >
          + Create Challenge {"🎯"}
        </button>
      )}

      {/* Completed Challenges */}
      {challenges.completed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
            style={{ fontSize: 14, color: "var(--muted)" }}
          >
            <span
              style={{
                transform: showCompleted ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                display: "inline-block",
              }}
            >
              {"▶"}
            </span>
            Show completed ({challenges.completed.length})
          </button>

          {showCompleted && (
            <div className="mt-2 space-y-3">
              {challenges.completed.map((challenge) => {
                const myProgress = getMyProgress(challenge, currentUserId);

                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() =>
                      router.push(`/board/challenge/${challenge.id}`)
                    }
                    className="w-full rounded-xl p-4 text-left transition-all active:scale-[0.98]"
                    style={{
                      background: "var(--surface)",
                      opacity: 0.7,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="font-bold truncate"
                        style={{
                          fontSize: 15,
                          color: "var(--foreground)",
                        }}
                      >
                        {challenge.title}
                      </div>
                      <span
                        className="shrink-0 font-semibold"
                        style={{ fontSize: 12, color: "var(--muted)" }}
                      >
                        {myProgress >= challenge.target
                          ? "✅ Completed"
                          : `${myProgress}/${challenge.target}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
