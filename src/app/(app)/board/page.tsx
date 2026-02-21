import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, getChallenges } from "@/app/actions/challenges";
import BoardTabs from "@/components/board/BoardTabs";

export default async function Board() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  const [leaderboardData, challengeData] = await Promise.all([
    getLeaderboard("streak"),
    getChallenges(),
  ]);

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-4">
      <h1
        className="font-bold"
        style={{ fontSize: 24, color: "var(--foreground)" }}
      >
        Board
      </h1>

      <BoardTabs
        leaderboardData={leaderboardData}
        challengeData={challengeData}
        currentUserId={currentUserId}
      />
    </div>
  );
}
