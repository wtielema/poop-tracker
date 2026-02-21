"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/app/actions/profile";

interface FriendInfo {
  username: string;
  display_name: string;
  avatar_emoji: string;
  streak: number;
}

interface PendingRequest {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
}

interface FriendsListProps {
  friends: FriendInfo[];
  pendingRequests: PendingRequest[];
}

export default function FriendsList({
  friends,
  pendingRequests,
}: FriendsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  function handleAccept(id: string) {
    startTransition(async () => {
      const result = await acceptFriendRequest(id);
      if (result.success) {
        setHandledIds((prev) => new Set(prev).add(id));
        router.refresh();
      }
    });
  }

  function handleDecline(id: string) {
    startTransition(async () => {
      const result = await declineFriendRequest(id);
      if (result.success) {
        setHandledIds((prev) => new Set(prev).add(id));
        router.refresh();
      }
    });
  }

  const visiblePending = pendingRequests.filter((r) => !handledIds.has(r.id));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="font-bold"
          style={{ fontSize: 18, color: "var(--foreground)" }}
        >
          Friends
        </h2>
        <span
          className="font-semibold"
          style={{ fontSize: 14, color: "var(--muted)" }}
        >
          {friends.length}
        </span>
      </div>

      {/* Pending Requests */}
      {visiblePending.length > 0 && (
        <div className="mb-4">
          <div
            className="mb-2 font-semibold"
            style={{ fontSize: 13, color: "var(--accent-dim)" }}
          >
            Pending Requests
          </div>
          <div className="space-y-2">
            {visiblePending.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>
                  {request.avatar_emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 14, color: "var(--foreground)" }}
                  >
                    {request.display_name}
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 12, color: "var(--muted)" }}
                  >
                    @{request.username}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(request.id)}
                    disabled={isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--success)" }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(request.id)}
                    disabled={isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "var(--background)",
                      color: "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend List */}
      {friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <button
              key={friend.username}
              type="button"
              onClick={() => router.push(`/friends/${friend.username}`)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all active:scale-[0.98]"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>
                {friend.avatar_emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate"
                  style={{ fontSize: 14, color: "var(--foreground)" }}
                >
                  {friend.display_name}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 12, color: "var(--muted)" }}
                >
                  @{friend.username}
                </div>
              </div>
              {friend.streak > 0 && (
                <div
                  className="flex items-center gap-1 font-bold"
                  style={{ fontSize: 14, color: "var(--foreground)" }}
                >
                  <span>{friend.streak}</span>
                  <span>\uD83D\uDD25</span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        visiblePending.length === 0 && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "var(--surface)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 36 }}>\uD83D\uDC4B</div>
            <p
              className="mt-2 font-medium"
              style={{ fontSize: 14, color: "var(--muted)" }}
            >
              No friends yet! Invite some to compete \uD83C\uDFC6
            </p>
          </div>
        )
      )}

      {/* Add Friends Button */}
      <button
        type="button"
        onClick={() => router.push("/friends/add")}
        className="mt-3 w-full rounded-xl py-3 text-center font-bold transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "var(--background)",
          color: "var(--primary)",
          border: "2px solid var(--primary)",
          fontSize: 14,
        }}
      >
        + Add Friends
      </button>
    </div>
  );
}
