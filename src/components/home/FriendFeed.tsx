"use client";

import Link from "next/link";

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
  return (
    <div>
      <h2
        className="mb-3 font-bold"
        style={{ fontSize: 16, color: "var(--foreground)" }}
      >
        Recent Activity
      </h2>

      {events.length === 0 ? (
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
