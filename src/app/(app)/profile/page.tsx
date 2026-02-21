import Link from "next/link";
import { getProfileData } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import StatsGrid from "@/components/profile/StatsGrid";
import AchievementGrid from "@/components/profile/AchievementGrid";
import FriendsList from "@/components/profile/FriendsList";
import ShareButton from "@/components/ShareButton";

export default async function Profile() {
  const data = await getProfileData();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-6">
      {/* User Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: "var(--surface)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontSize: 40,
            lineHeight: 1,
          }}
        >
          {data.profile.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 22, color: "var(--foreground)" }}
          >
            {data.profile.display_name}
          </h1>
          <div
            className="truncate"
            style={{ fontSize: 14, color: "var(--muted)" }}
          >
            @{data.profile.username}
          </div>
        </div>
        <Link
          href="/profile/settings"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold transition-opacity hover:opacity-80"
          style={{
            fontSize: 13,
            color: "var(--primary)",
            background: "var(--background)",
            border: "1px solid var(--border)",
          }}
        >
          Edit
        </Link>
      </div>

      {/* Share Stats */}
      {userId && (
        <div className="flex justify-center">
          <ShareButton userId={userId} label="Share Stats" />
        </div>
      )}

      {/* Stats */}
      <StatsGrid stats={data.stats} />

      {/* Achievements */}
      <AchievementGrid achievements={data.achievements} />

      {/* Friends */}
      <FriendsList
        friends={data.friends}
        pendingRequests={data.pendingRequests}
      />
    </div>
  );
}
