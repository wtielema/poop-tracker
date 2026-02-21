import Link from "next/link";
import { getChallengeDetail } from "@/app/actions/challenges";
import ChallengeDetailClient from "./ChallengeDetailClient";

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({
  params,
}: ChallengeDetailPageProps) {
  const { id } = await params;
  const data = await getChallengeDetail(id);

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-6 py-4 space-y-4">
        <Link
          href="/board"
          className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
          style={{ fontSize: 14, color: "var(--primary)" }}
        >
          {"←"} Back to Board
        </Link>
        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: "var(--surface)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 48 }}>{"🔍"}</div>
          <p
            className="mt-3 font-medium"
            style={{ fontSize: 15, color: "var(--muted)" }}
          >
            Challenge not found or you don&apos;t have access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-4 animate-page-enter">
      <Link
        href="/board"
        className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
        style={{ fontSize: 14, color: "var(--primary)" }}
      >
        {"←"} Back to Board
      </Link>

      <ChallengeDetailClient
        challenge={data.challenge}
        currentUserId={data.currentUserId}
        challengeId={id}
      />
    </div>
  );
}
