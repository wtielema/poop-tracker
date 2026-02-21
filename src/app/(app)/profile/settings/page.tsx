"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import type { MapVisibility } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_EMOJIS = [
  "\uD83D\uDCA9",
  "\uD83E\uDD84",
  "\uD83D\uDC38",
  "\uD83D\uDD25",
  "\uD83D\uDC7B",
  "\uD83C\uDF83",
  "\uD83C\uDF08",
  "\u2B50",
  "\uD83C\uDF55",
  "\uD83C\uDFAE",
  "\uD83D\uDC36",
  "\uD83C\uDF2E",
];

const MAP_OPTIONS: { value: MapVisibility; label: string }[] = [
  { value: "friends", label: "Friends" },
  { value: "only_me", label: "Only Me" },
  { value: "nobody", label: "Nobody" },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("\uD83D\uDCA9");
  const [mapVisibility, setMapVisibility] = useState<MapVisibility>("friends");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current profile
  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_emoji, map_visibility")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setAvatarEmoji(profile.avatar_emoji);
        setMapVisibility(profile.map_visibility);
      }
      setLoading(false);
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateProfile({
      display_name: displayName.trim(),
      avatar_emoji: avatarEmoji,
      map_visibility: mapVisibility,
    });

    setSaving(false);

    if (result.success) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            style={{ color: "var(--primary)", fontSize: 20 }}
          >
            &larr;
          </button>
          <h1
            className="font-bold"
            style={{ fontSize: 22, color: "var(--foreground)" }}
          >
            Settings
          </h1>
        </div>
        <div
          className="text-center py-12"
          style={{ color: "var(--muted)", fontSize: 14 }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          style={{ color: "var(--primary)", fontSize: 20 }}
        >
          &larr;
        </button>
        <h1
          className="font-bold"
          style={{ fontSize: 22, color: "var(--foreground)" }}
        >
          Settings
        </h1>
      </div>

      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Display Name */}
        <div>
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

        {/* Avatar Emoji Picker */}
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Avatar
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                className="flex h-12 w-full items-center justify-center rounded-xl text-2xl transition-all"
                style={{
                  border:
                    avatarEmoji === emoji
                      ? "3px solid var(--accent)"
                      : "2px solid var(--border)",
                  background:
                    avatarEmoji === emoji
                      ? "var(--accent)" + "22"
                      : "var(--background)",
                  transform: avatarEmoji === emoji ? "scale(1.1)" : "scale(1)",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Map Visibility */}
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Map Visibility
          </label>
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: "2px solid var(--border)" }}
          >
            {MAP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMapVisibility(option.value)}
                className="flex-1 py-2.5 text-center font-semibold transition-all"
                style={{
                  fontSize: 13,
                  background:
                    mapVisibility === option.value
                      ? "var(--primary)"
                      : "var(--background)",
                  color:
                    mapVisibility === option.value
                      ? "#FFFFFF"
                      : "var(--muted)",
                  borderRight:
                    option.value !== "nobody"
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p
            className="mt-1.5"
            style={{ fontSize: 12, color: "var(--muted)" }}
          >
            Who can see your log locations on the map
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          className="rounded-lg p-3 text-sm font-medium"
          style={{ background: "#FEE", color: "var(--danger)" }}
        >
          {error}
        </p>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          height: "48px",
          background: "var(--accent)",
          color: "var(--foreground)",
        }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {/* Success Toast */}
      {showToast && (
        <div
          className="fixed left-4 right-4 bottom-24 mx-auto max-w-sm rounded-xl px-4 py-3 text-center font-semibold"
          style={{
            background: "var(--success)",
            color: "#FFFFFF",
            fontSize: 14,
            boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
            animation: "toast-slide-up 0.3s ease-out",
            zIndex: 50,
          }}
        >
          Settings saved!
        </div>
      )}
    </div>
  );
}
