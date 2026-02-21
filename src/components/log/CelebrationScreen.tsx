"use client";

import { useEffect } from "react";
import { STREAK_THRESHOLDS } from "@/lib/constants";
import ShareButton from "@/components/ShareButton";

interface CelebrationScreenProps {
  streak: number;
  newAchievements: { name: string; icon_emoji: string; description: string }[];
  funFact: string;
  onDone: () => void;
  userId?: string;
}

function getStreakInfo(streak: number) {
  return (
    STREAK_THRESHOLDS.find((t) => streak >= t.min && streak <= t.max) ??
    STREAK_THRESHOLDS[0]
  );
}

export default function CelebrationScreen({
  streak,
  newAchievements,
  funFact,
  onDone,
  userId,
}: CelebrationScreenProps) {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(onDone, 10000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const streakInfo = getStreakInfo(streak);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(180deg, #FFF8F0 0%, #FFEFD5 50%, #FFF8F0 100%)",
      }}
      onClick={onDone}
    >
      {/* Streak section */}
      <div className="mb-6 text-center">
        <div className="animate-fire" style={{ fontSize: 48 }}>
          {streakInfo.fires}
        </div>
        <div
          className="mt-2 font-bold"
          style={{ fontSize: 56, color: "var(--primary)", lineHeight: 1.1 }}
        >
          {streak}
        </div>
        <div
          className="font-semibold"
          style={{ fontSize: 16, color: "var(--muted)" }}
        >
          day streak
        </div>
        <div
          className="mt-1 font-bold"
          style={{ fontSize: 14, color: "var(--accent-dim)" }}
        >
          {streakInfo.label}
        </div>
      </div>

      {/* Achievements */}
      {newAchievements.length > 0 && (
        <div className="mb-6 w-full max-w-xs space-y-3">
          <div
            className="text-center font-bold uppercase tracking-wide"
            style={{ fontSize: 12, color: "var(--muted)" }}
          >
            New Achievements!
          </div>
          {newAchievements.map((achievement) => (
            <div
              key={achievement.name}
              className="animate-confetti flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "var(--surface)",
                border: "2px solid var(--accent)",
                boxShadow: "0 4px 12px rgba(245, 197, 66, 0.25)",
              }}
            >
              <span style={{ fontSize: 32 }}>{achievement.icon_emoji}</span>
              <div>
                <div className="font-bold" style={{ fontSize: 14, color: "var(--foreground)" }}>
                  {achievement.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {achievement.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fun fact */}
      {funFact && (
        <div
          className="mb-8 w-full max-w-xs rounded-xl px-4 py-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="mb-1 font-bold uppercase tracking-wide"
            style={{ fontSize: 11, color: "var(--muted)" }}
          >
            Did you know?
          </div>
          <div style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.5 }}>
            {funFact}
          </div>
        </div>
      )}

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDone}
        className="rounded-xl px-8 py-3 font-bold transition-all active:scale-95"
        style={{
          fontSize: 18,
          background: "var(--accent)",
          color: "var(--foreground)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(245, 197, 66, 0.35)",
        }}
      >
        Nice! \uD83D\uDCAA
      </button>

      {/* Share button */}
      {userId && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <ShareButton userId={userId} label="Share Stats" />
        </div>
      )}
    </div>
  );
}
