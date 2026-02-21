"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRandomFact } from "@/lib/fun-facts";

interface FeedEvent {
  id: string;
  text: string;
  emoji: string;
  time: string;
}

interface FriendFeedProps {
  events: FeedEvent[];
}

function formatRelativeTime(isoTime: string): string {
  const now = Date.now();
  const then = new Date(isoTime).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default function FriendFeed({ events }: FriendFeedProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // Show spinner briefly even if refresh is instant
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="font-bold"
          style={{ fontSize: 16, color: "var(--foreground)" }}
        >
          Recent Activity
        </h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="tap-bounce flex items-center justify-center rounded-full"
          style={{
            width: 32,
            height: 32,
            fontSize: 16,
            background: "var(--background)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            transition: "transform 0.3s ease",
            transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
          }}
          aria-label="Refresh feed"
        >
          {"\uD83D\uDD04"}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="space-y-3">
          <Link
            href="/profile"
            style={{ textDecoration: "none" }}
          >
            <div
              className="rounded-xl px-4 py-4 text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
                No friends yet! Add some to see what they&apos;re up to {"\uD83E\uDD8B"}
              </div>
            </div>
          </Link>
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "rgba(245, 197, 66, 0.1)",
              border: "1px solid rgba(245, 197, 66, 0.25)",
            }}
          >
            <div
              className="mb-1 font-bold"
              style={{ fontSize: 13, color: "var(--accent-dim)" }}
            >
              {"\uD83D\uDCA1"} Did you know?
            </div>
            <div style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.5 }}>
              {getRandomFact()}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 20 }}>{event.emoji}</span>
              <div className="flex-1 min-w-0">
                <span
                  className="block truncate"
                  style={{ fontSize: 14, color: "var(--foreground)" }}
                >
                  {event.text}
                </span>
              </div>
              <span
                className="shrink-0"
                style={{ fontSize: 12, color: "var(--muted)" }}
              >
                {formatRelativeTime(event.time)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
