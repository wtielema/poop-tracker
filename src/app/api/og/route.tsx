import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const BRISTOL_COLORS = [
  "#8B6914", // 1 - hard/brown
  "#A0782C", // 2 - lumpy brown
  "#B8860B", // 3 - dark goldenrod
  "#DAA520", // 4 - goldenrod (ideal)
  "#F0C050", // 5 - soft yellow-brown
  "#E8A030", // 6 - orange-brown
  "#C06030", // 7 - reddish
];

function getGenericCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF8F0",
          border: "8px dashed #C4A57B",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>💩</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#5C4033",
            marginBottom: 8,
          }}
        >
          PoopLog
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#8B7355",
          }}
        >
          Track it. Streak it. Share it.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return getGenericCard();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return getGenericCard();
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_emoji")
    .eq("id", userId)
    .single();

  if (!profile) {
    return getGenericCard();
  }

  // Fetch logs for stats
  const { data: logs } = await supabase
    .from("logs")
    .select("bristol_scale, logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  const allLogs = logs ?? [];

  // Calculate current streak
  let currentStreak = 0;
  if (allLogs.length > 0) {
    const dates = [
      ...new Set(allLogs.map((l) => l.logged_at.substring(0, 10))),
    ].sort((a, b) => (a > b ? -1 : 1));

    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const current = new Date(dates[i]);
        const next = new Date(dates[i + 1]);
        const diffDays = Math.round(
          (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Logs this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();
  const logsThisWeek = allLogs.filter((l) => l.logged_at >= weekAgoStr).length;

  // Bristol distribution (counts per type 1-7)
  const bristolCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const log of allLogs) {
    const scale = log.bristol_scale;
    if (scale >= 1 && scale <= 7) {
      bristolCounts[scale - 1]++;
    }
  }
  const maxBristol = Math.max(...bristolCounts, 1);

  // Fetch top achievement
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false })
    .limit(1);

  let topAchievementName = "None yet";
  if (userAchievements && userAchievements.length > 0) {
    const { data: achievement } = await supabase
      .from("achievements")
      .select("name")
      .eq("id", userAchievements[0].achievement_id)
      .single();
    if (achievement) {
      topAchievementName = achievement.name;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FFF8F0",
          border: "8px dashed #C4A57B",
          fontFamily: "sans-serif",
          padding: "40px 60px",
        }}
      >
        {/* Top: Avatar + Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: "#F5EDE3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
            }}
          >
            {profile.avatar_emoji}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#5C4033",
              }}
            >
              {profile.display_name}
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#8B7355",
              }}
            >
              @{profile.username}
            </div>
          </div>
        </div>

        {/* Middle: Stat boxes */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* Streak */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#F5EDE3",
              borderRadius: 20,
              padding: "24px 16px",
              border: "2px solid #E8DDD0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>🔥</div>
            <div
              style={{ fontSize: 36, fontWeight: 800, color: "#5C4033" }}
            >
              {currentStreak}
            </div>
            <div
              style={{ fontSize: 16, color: "#8B7355", fontWeight: 600 }}
            >
              day streak
            </div>
          </div>

          {/* This Week */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#F5EDE3",
              borderRadius: 20,
              padding: "24px 16px",
              border: "2px solid #E8DDD0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>📊</div>
            <div
              style={{ fontSize: 36, fontWeight: 800, color: "#5C4033" }}
            >
              {logsThisWeek}
            </div>
            <div
              style={{ fontSize: 16, color: "#8B7355", fontWeight: 600 }}
            >
              this week
            </div>
          </div>

          {/* Top Achievement */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#F5EDE3",
              borderRadius: 20,
              padding: "24px 16px",
              border: "2px solid #E8DDD0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#5C4033",
                textAlign: "center",
              }}
            >
              {topAchievementName}
            </div>
            <div
              style={{ fontSize: 16, color: "#8B7355", fontWeight: 600 }}
            >
              top achievement
            </div>
          </div>
        </div>

        {/* Bottom: Bristol distribution */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Bristol Distribution
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              height: 100,
            }}
          >
            {bristolCounts.map((count, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: Math.max(8, (count / maxBristol) * 80),
                    background: BRISTOL_COLORS[i],
                    borderRadius: 6,
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "#8B7355",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#8B7355",
              fontWeight: 600,
            }}
          >
            PoopLog 💩 — Track it. Streak it. Share it.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
