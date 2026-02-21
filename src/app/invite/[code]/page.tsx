"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveInviteCode, sendFriendRequest } from "@/app/actions/friends";

type InviteState =
  | "loading"
  | "not_logged_in"
  | "sent"
  | "already_friends"
  | "self_invite"
  | "invalid"
  | "error";

export default function InvitePage() {
  const params = useParams();
  const code = params.code as string;

  const [state, setState] = useState<InviteState>("loading");
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleInvite() {
      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState("not_logged_in");
        return;
      }

      // Resolve the invite code
      const resolved = await resolveInviteCode(code);

      if (!resolved) {
        setState("invalid");
        return;
      }

      setDisplayName(resolved.displayName);
      setAvatarEmoji(resolved.avatarEmoji);

      // Check if inviting self
      if (resolved.userId === user.id) {
        setState("self_invite");
        return;
      }

      // Try sending friend request
      const result = await sendFriendRequest(resolved.userId);

      if (result.success) {
        setState("sent");
      } else if (result.error === "Already friends") {
        setState("already_friends");
      } else if (result.error === "Request already pending") {
        setState("sent");
      } else {
        setErrorMsg(result.error ?? "Something went wrong");
        setState("error");
      }
    }

    handleInvite();
  }, [code]);

  const returnUrl = encodeURIComponent(`/invite/${code}`);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-md text-center">
        {state === "loading" && (
          <div>
            <div className="mb-4 text-5xl" style={{ animationDuration: "2s" }}>
              {"💩"}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 16 }}>
              Processing invite...
            </p>
          </div>
        )}

        {state === "not_logged_in" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4 text-5xl">{"💩"}</div>
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Log in to accept this invite
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              You need an account to add friends on PoopLog
            </p>
            <Link
              href={`/login?returnUrl=${returnUrl}`}
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Log In
            </Link>
          </div>
        )}

        {state === "sent" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            {avatarEmoji && (
              <div className="mb-3 text-6xl">{avatarEmoji}</div>
            )}
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Friend request sent to {displayName}! {"🎉"}
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              {"They'll"} see your request next time they check their profile
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Go Home
            </Link>
          </div>
        )}

        {state === "already_friends" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            {avatarEmoji && (
              <div className="mb-3 text-6xl">{avatarEmoji}</div>
            )}
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {"You're"} already friends with {displayName}! {"🤝"}
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              Check out their profile to see their stats
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Go Home
            </Link>
          </div>
        )}

        {state === "self_invite" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4 text-5xl">{"😄"}</div>
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {"You can't"} add yourself as a friend
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              Share this link with someone else!
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Go Home
            </Link>
          </div>
        )}

        {state === "invalid" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4 text-5xl">{"❓"}</div>
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Invalid invite link
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              This invite link is no longer valid or has expired
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Go Home
            </Link>
          </div>
        )}

        {state === "error" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4 text-5xl">{"⚠️"}</div>
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Something went wrong
            </h1>
            <p className="mb-6" style={{ color: "var(--muted)", fontSize: 14 }}>
              {errorMsg}
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 15,
                height: 48,
                lineHeight: "48px",
              }}
            >
              Go Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
