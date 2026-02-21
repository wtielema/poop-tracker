"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  searchUsers,
  sendFriendRequest,
  getInviteCode,
} from "@/app/actions/friends";

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
}

export default function AddFriendPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load invite code on mount
  useEffect(() => {
    getInviteCode().then((result) => {
      if (result) setInviteUrl(result.url);
    });
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const data = await searchUsers(q.trim());
    setResults(data);
    setHasSearched(true);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  async function handleSend(userId: string) {
    setSendingId(userId);
    const result = await sendFriendRequest(userId);
    setSendingId(null);

    if (result.success) {
      setSentIds((prev) => new Set(prev).add(userId));
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-6">
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
          Add Friends
        </h1>
      </div>

      {/* Search Section */}
      <div>
        <div
          className="relative flex items-center rounded-xl overflow-hidden"
          style={{
            border: "2px solid var(--border)",
            background: "var(--background)",
          }}
        >
          <span
            className="pl-4"
            style={{ color: "var(--muted)", fontSize: 18 }}
          >
            &#x1F50D;
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full px-3 text-base outline-none"
            style={{
              height: "48px",
              fontSize: "16px",
              background: "transparent",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Search Results */}
        <div className="mt-3 space-y-2">
          {searching && (
            <div
              className="py-6 text-center"
              style={{ color: "var(--muted)", fontSize: 14 }}
            >
              Searching...
            </div>
          )}

          {!searching && hasSearched && results.length === 0 && (
            <div
              className="rounded-xl py-6 text-center"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 32 }}>&#x1F614;</div>
              <p
                className="mt-2"
                style={{ color: "var(--muted)", fontSize: 14 }}
              >
                No users found
              </p>
            </div>
          )}

          {!searching && !hasSearched && query.length === 0 && (
            <div
              className="py-6 text-center"
              style={{ color: "var(--muted)", fontSize: 14 }}
            >
              Search by username or name
            </div>
          )}

          {results.map((user) => {
            const isSent = sentIds.has(user.id);
            const isSending = sendingId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: "var(--surface)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>
                  {user.avatar_emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 14, color: "var(--foreground)" }}
                  >
                    {user.display_name}
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 12, color: "var(--muted)" }}
                  >
                    @{user.username}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSend(user.id)}
                  disabled={isSent || isSending}
                  className="rounded-xl px-4 py-2 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-70"
                  style={{
                    background: isSent ? "var(--success)" : "var(--primary)",
                    color: "#FFFFFF",
                    minWidth: 72,
                  }}
                >
                  {isSending ? "..." : isSent ? "Sent \u2713" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Section */}
      <div>
        <h2
          className="mb-3 font-bold"
          style={{ fontSize: 16, color: "var(--foreground)" }}
        >
          Or share your invite link
        </h2>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {inviteUrl ? (
            <>
              <div
                className="rounded-lg px-3 py-2.5 mb-3 break-all"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                }}
              >
                {inviteUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full rounded-xl py-3 text-center font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: copied ? "var(--success)" : "var(--accent)",
                  color: copied ? "#FFFFFF" : "var(--foreground)",
                  fontSize: 14,
                }}
              >
                {copied ? "Copied!" : "Copy Link \uD83D\uDCCB"}
              </button>
            </>
          ) : (
            <div
              className="py-4 text-center"
              style={{ color: "var(--muted)", fontSize: 14 }}
            >
              Loading invite link...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
