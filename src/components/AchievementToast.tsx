"use client";

import { useEffect, useState, useCallback } from "react";

interface AchievementInfo {
  name: string;
  icon_emoji: string;
  description: string;
}

interface AchievementToastProps {
  achievements: AchievementInfo[];
  onDismiss: () => void;
}

const CONFETTI_COLORS = [
  "#F5C542", // gold
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#A78BFA", // purple
  "#FB923C", // orange
  "#34D399", // green
  "#F472B6", // pink
  "#60A5FA", // blue
];

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const left = Math.random() * 100;
  const size = 4 + Math.random() * 6;
  const duration = 1.5 + Math.random() * 1;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: color,
        animation: `confetti-rise ${duration}s ease-out ${delay}s forwards`,
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default function AchievementToast({
  achievements,
  onDismiss,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Wait for exit animation before calling onDismiss
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  if (achievements.length === 0) return null;

  return (
    <>
      {/* Inline keyframes for confetti rise animation */}
      <style>{`
        @keyframes confetti-rise {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes toast-slide-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes toast-slide-down {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="fixed left-0 right-0 z-50 flex flex-col items-center gap-3 px-4"
        style={{
          bottom: 80, // above bottom nav
          animation: visible
            ? "toast-slide-up 0.4s ease-out forwards"
            : "toast-slide-down 0.3s ease-in forwards",
        }}
        onClick={dismiss}
      >
        {achievements.map((achievement, index) => (
          <div
            key={achievement.name}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--accent)",
              boxShadow: "0 8px 24px rgba(245, 197, 66, 0.3), 0 2px 8px rgba(0,0,0,0.1)",
              animationDelay: `${index * 0.15}s`,
            }}
          >
            {/* Confetti particles */}
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {CONFETTI_COLORS.map((color, i) => (
                <ConfettiParticle
                  key={`${achievement.name}-${i}`}
                  delay={0.1 + i * 0.08}
                  color={color}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-3 px-4 py-3">
              <span style={{ fontSize: 36, lineHeight: 1 }}>
                {achievement.icon_emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="font-bold"
                  style={{ fontSize: 15, color: "var(--foreground)" }}
                >
                  {achievement.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {achievement.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
