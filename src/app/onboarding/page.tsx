"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_EMOJIS = ["💩", "🦄", "🐸", "🔥", "👻", "🎃", "🌈", "⭐", "🍕", "🎮", "🐶", "🌮"];

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💩");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Validate username format in real-time
  useEffect(() => {
    if (!username) {
      setUsernameError(null);
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError("3-20 characters, lowercase letters, numbers, and underscores only");
    } else {
      setUsernameError(null);
    }
  }, [username]);

  // Check username uniqueness on blur
  async function checkUniqueness() {
    if (!username || !USERNAME_REGEX.test(username)) return;

    setCheckingUsername(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (data) {
      // Check if this is the current user's own profile
      const { data: { user } } = await supabase.auth.getUser();
      if (data.id !== user?.id) {
        setUsernameError("Username is already taken");
      }
    }
    setCheckingUsername(false);
  }

  async function handleSubmit() {
    if (!username || !displayName || usernameError) return;

    setSubmitError(null);
    setLoading(true);

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Not authenticated. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      display_name: displayName,
      avatar_emoji: selectedEmoji,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setSubmitError("Username is already taken. Please choose another.");
      } else {
        setSubmitError(error.message);
      }
    } else {
      router.push("/");
    }
  }

  const isValid = username && displayName && USERNAME_REGEX.test(username) && !usernameError;

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
            Welcome to PoopLog! 💩
          </h1>
          <p className="text-lg" style={{ color: "var(--muted)" }}>
            Let&apos;s set up your profile
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--surface)",
            boxShadow: "var(--surface-shadow)",
          }}
        >
          {/* Username */}
          <div className="mb-5">
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onBlur={checkUniqueness}
              placeholder="cool_pooper"
              className="block w-full rounded-xl px-4 text-base outline-none transition-all"
              style={{
                height: "48px",
                fontSize: "16px",
                border: `2px solid ${usernameError ? "var(--danger)" : "var(--border)"}`,
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            />
            {checkingUsername && (
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                Checking availability...
              </p>
            )}
            {usernameError && (
              <p className="mt-1 text-xs font-medium" style={{ color: "var(--danger)" }}>
                {usernameError}
              </p>
            )}
          </div>

          {/* Display name */}
          <div className="mb-5">
            <label
              htmlFor="displayName"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="block w-full rounded-xl px-4 text-base outline-none transition-all"
              style={{
                height: "48px",
                fontSize: "16px",
                border: "2px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Avatar emoji picker */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Pick your avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className="flex h-12 w-full items-center justify-center rounded-xl text-2xl transition-all"
                  style={{
                    border: selectedEmoji === emoji
                      ? "3px solid var(--accent)"
                      : "2px solid var(--border)",
                    background: selectedEmoji === emoji ? "var(--accent)" + "22" : "var(--background)",
                    transform: selectedEmoji === emoji ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <p className="mb-4 rounded-lg p-3 text-sm font-medium" style={{ background: "#FEE", color: "var(--danger)" }}>
              {submitError}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              height: "48px",
              background: "var(--accent)",
              color: "var(--foreground)",
            }}
          >
            {loading ? "Setting up..." : "Let's Go! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
