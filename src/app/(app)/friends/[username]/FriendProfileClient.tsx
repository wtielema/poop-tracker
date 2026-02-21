"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { sendFriendRequest } from "@/app/actions/friends";
import { STREAK_THRESHOLDS } from "@/lib/constants";
import type { MapPin } from "@/app/actions/map";

const PoopMap = dynamic(() => import("@/components/map/PoopMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{ height: 300, background: "var(--surface)" }}
    >
      <p style={{ fontSize: 14, color: "var(--muted)" }}>Loading map...</p>
    </div>
  ),
});

interface FriendAchievement {
  slug: string;
  name: string;
  icon_emoji: string;
  description: string;
  unlocked_at: string;
}

interface FriendProfileData {
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_emoji: string;
  };
  isFriend: boolean;
  pendingRequest: boolean;
  stats?: {
    totalLogs: number;
    currentStreak: number;
    longestStreak: number;
  };
  achievements?: FriendAchievement[];
}

function getStreakFire(streak: number): string {
  const threshold = STREAK_THRESHOLDS.find(
    (t) => streak >= t.min && streak <= t.max
  );
  return threshold?.fires ?? "";
}

export default function FriendProfileClient({
  data,
  mapPins,
  mapAllowed,
}: {
  data: FriendProfileData;
  mapPins: MapPin[];
  mapAllowed: boolean;
}) {
  const router = useRouter();
  const [requestSent, setRequestSent] = useState(data.pendingRequest);
  const [sending, setSending] = useState(false);
  const [showMap, setShowMap] = useState(false);

  async function handleSendRequest() {
    setSending(true);
    const result = await sendFriendRequest(data.profile.id);
    if (result.success) {
      setRequestSent(true);
    }
    setSending(false);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          style={{ color: "var(--muted)", fontSize: 20 }}
        >
          &larr;
        </button>
        <h1
          className="font-bold"
          style={{ fontSize: 22, color: "var(--foreground)" }}
        >
          Profile
        </h1>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            background: "var(--surface)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            fontSize: 52,
            lineHeight: 1,
          }}
        >
          {data.profile.avatar_emoji}
        </div>
        <h2
          className="mt-3 font-bold"
          style={{ fontSize: 24, color: "var(--foreground)" }}
        >
          {data.profile.display_name}
        </h2>
        <div style={{ fontSize: 14, color: "var(--muted)" }}>
          @{data.profile.username}
        </div>
      </div>

      {data.isFriend ? (
        <>
          {/* Stats Summary */}
          {data.stats && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                value={`${data.stats.totalLogs}`}
                emoji={"\uD83D\uDCA9"}
                label="Total Logs"
              />
              <StatCard
                value={`${data.stats.currentStreak}`}
                emoji={
                  data.stats.currentStreak > 0
                    ? getStreakFire(data.stats.currentStreak)
                    : "\uD83D\uDD25"
                }
                label="Streak"
              />
              <StatCard
                value={`${data.stats.longestStreak}`}
                emoji={"\uD83C\uDFC5"}
                label="Best Streak"
              />
            </div>
          )}

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <div>
              <h3
                className="mb-3 font-bold"
                style={{ fontSize: 18, color: "var(--foreground)" }}
              >
                Achievements
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {data.achievements.map((a) => (
                  <div
                    key={a.slug}
                    className="flex flex-col items-center rounded-xl p-3"
                    style={{
                      background: "var(--surface)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span style={{ fontSize: 32, lineHeight: 1 }}>
                      {a.icon_emoji}
                    </span>
                    <span
                      className="mt-1 text-center font-medium leading-tight"
                      style={{ fontSize: 11, color: "var(--foreground)" }}
                    >
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.achievements && data.achievements.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 32 }}>{"\uD83C\uDFC6"}</div>
              <p
                className="mt-2"
                style={{ fontSize: 14, color: "var(--muted)" }}
              >
                No achievements unlocked yet
              </p>
            </div>
          )}

          {/* Map section */}
          {mapAllowed && mapPins.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
                style={{
                  background: showMap ? "var(--border)" : "var(--primary)",
                  color: showMap ? "var(--foreground)" : "#FFFFFF",
                  fontSize: 15,
                  height: 48,
                }}
              >
                {showMap ? "Hide Map" : `\u{1F5FA}\uFE0F View Map (${mapPins.length} pins)`}
              </button>

              {showMap && (
                <div
                  className="mt-3 rounded-xl overflow-hidden"
                  style={{ height: 300 }}
                >
                  <PoopMap
                    pins={mapPins}
                    friendPins={[]}
                    showFriends={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                {mapAllowed
                  ? "\u{1F5FA}\uFE0F No geotagged logs yet"
                  : "\u{1F512} Map not shared"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Not friends state */}
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "var(--surface)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 40 }}>{"\uD83D\uDD12"}</div>
            <p
              className="mt-3 font-medium"
              style={{ fontSize: 14, color: "var(--muted)" }}
            >
              Become friends to see their stats and achievements
            </p>

            <button
              type="button"
              onClick={handleSendRequest}
              disabled={requestSent || sending}
              className="mt-4 w-full rounded-xl py-3 font-bold transition-all hover:opacity-90 disabled:opacity-70"
              style={{
                background: requestSent ? "var(--muted)" : "var(--primary)",
                color: "#FFFFFF",
                fontSize: 15,
                height: 48,
              }}
            >
              {sending
                ? "Sending..."
                : requestSent
                ? "Request Sent"
                : "Send Friend Request"}
            </button>
          </div>
        </>
      )}
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
