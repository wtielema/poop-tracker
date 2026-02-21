"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  joinChallenge,
  type ChallengeData,
} from "@/app/actions/challenges";

interface ChallengeDetailClientProps {
  challenge: ChallengeData;
  currentUserId: string;
  challengeId: string;
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  return `${startDate.toLocaleDateString("en-US", opts)} - ${endDate.toLocaleDateString("en-US", opts)}`;
}

function getTimeProgress(start: string, end: string): number {
  const now = new Date().getTime();
  const startMs = new Date(start + "T00:00:00").getTime();
  const endMs = new Date(end + "T23:59:59").getTime();
  const total = endMs - startMs;
  const elapsed = now - startMs;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function ChallengeDetailClient({
  challenge,
  currentUserId,
  challengeId,
}: ChallengeDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState("");

  const isParticipant = challenge.participants.some(
    (p) => p.userId === currentUserId
  );
  const daysLeft = getDaysRemaining(challenge.endDate);
  const timePct = getTimeProgress(challenge.startDate, challenge.endDate);
  const isActive = daysLeft > 0;

  function handleJoin() {
    setJoinError("");
    startTransition(async () => {
      const result = await joinChallenge(challengeId);
      if (result.success) {
        router.refresh();
      } else {
        setJoinError(result.error ?? "Failed to join");
      }
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/board/challenge/${challengeId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <div className="space-y-4">
      {/* Challenge Header */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--surface)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          className="font-bold"
          style={{ fontSize: 22, color: "var(--foreground)" }}
        >
          {challenge.title}
        </h1>

        {challenge.description && (
          <p
            className="mt-1"
            style={{ fontSize: 14, color: "var(--muted)" }}
          >
            {challenge.description}
          </p>
        )}

        {/* Type + Target + Date */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 font-semibold"
            style={{
              fontSize: 12,
              background: "var(--accent)",
              color: "var(--foreground)",
            }}
          >
            {challenge.type === "streak" ? "Streak \uD83D\uDD25" : "Log Count \uD83D\uDCCA"}{" "}
            · Target: {challenge.target}
          </span>
          <span
            className="rounded-full px-3 py-1 font-semibold"
            style={{
              fontSize: 12,
              background: "var(--background)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {formatDateRange(challenge.startDate, challenge.endDate)}
          </span>
        </div>

        {/* Time Remaining Progress */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span
              className="font-semibold"
              style={{ fontSize: 12, color: "var(--muted)" }}
            >
              Time remaining
            </span>
            <span
              className="font-semibold"
              style={{ fontSize: 12, color: "var(--muted)" }}
            >
              {isActive
                ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                : "Ended"}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${timePct}%`,
                background: isActive ? "var(--accent)" : "var(--muted)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div>
        <h2
          className="mb-3 font-bold"
          style={{ fontSize: 18, color: "var(--foreground)" }}
        >
          Participants ({challenge.participants.length})
        </h2>

        <div className="space-y-2">
          {challenge.participants.map((participant, index) => {
            const rank = index + 1;
            const isMe = participant.userId === currentUserId;
            const progressPct = Math.min(
              100,
              (participant.progress / challenge.target) * 100
            );

            let rankIcon: string;
            if (rank === 1) {
              rankIcon = "\uD83D\uDC51";
            } else if (rank === 2) {
              rankIcon = "\uD83E\uDD48";
            } else if (rank === 3) {
              rankIcon = "\uD83E\uDD49";
            } else {
              rankIcon = `${rank}`;
            }

            return (
              <div
                key={participant.userId}
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
                    width: 28,
                    height: 28,
                    fontSize: rank <= 3 ? 18 : 14,
                    color: "var(--foreground)",
                  }}
                >
                  {rankIcon}
                </div>

                {/* Avatar + Name */}
                <span style={{ fontSize: 24, lineHeight: 1 }}>
                  {participant.avatarEmoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 14, color: "var(--foreground)" }}
                  >
                    {participant.displayName}
                    {isMe && (
                      <span
                        className="ml-1"
                        style={{ fontSize: 11, color: "var(--muted)" }}
                      >
                        (you)
                      </span>
                    )}
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progressPct}%`,
                          background:
                            progressPct >= 100
                              ? "var(--success)"
                              : "var(--accent)",
                        }}
                      />
                    </div>
                    <span
                      className="shrink-0 font-semibold"
                      style={{ fontSize: 12, color: "var(--muted)" }}
                    >
                      {participant.progress}/{challenge.target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isParticipant && (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isPending || !isActive}
            className="flex-1 rounded-xl py-3 font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: "var(--success)",
              color: "#FFFFFF",
              fontSize: 14,
            }}
          >
            {isPending ? "Joining..." : "Join Challenge"}
          </button>
        )}

        <button
          type="button"
          onClick={handleShare}
          className={`${isParticipant ? "flex-1" : ""} rounded-xl py-3 px-4 font-bold transition-all hover:opacity-90 active:scale-[0.98]`}
          style={{
            background: "var(--primary)",
            color: "#FFFFFF",
            fontSize: 14,
          }}
        >
          {copied ? "Copied! \u2705" : "Share Challenge \uD83D\uDCCB"}
        </button>
      </div>

      {/* Join Error */}
      {joinError && (
        <p
          className="text-center font-medium"
          style={{ fontSize: 13, color: "#e74c3c" }}
        >
          {joinError}
        </p>
      )}
    </div>
  );
}
