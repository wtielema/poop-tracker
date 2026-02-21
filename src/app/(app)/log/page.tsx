"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NOTE_PLACEHOLDERS } from "@/lib/constants";
import type { BristolScale, Mood } from "@/lib/types";
import BristolPicker from "@/components/log/BristolPicker";
import DurationPicker from "@/components/log/DurationPicker";
import MoodPicker from "@/components/log/MoodPicker";
import GeotagToggle from "@/components/log/GeotagToggle";
import CelebrationScreen from "@/components/log/CelebrationScreen";
import { createLog } from "@/app/actions/logs";
import { createClient } from "@/lib/supabase/client";

interface CelebrationData {
  streak: number;
  newAchievements: { name: string; icon_emoji: string; description: string }[];
  funFact: string;
}

export default function LogPage() {
  const [bristolScale, setBristolScale] = useState<BristolScale | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const durationRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const placeholder = useMemo(
    () => NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)],
    []
  );

  const canSubmit = bristolScale !== null && mood !== null && !submitting;

  const handleDurationChange = useCallback((seconds: number) => {
    durationRef.current = seconds;
    setDurationSeconds(seconds);
  }, []);

  const handleLocation = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleClearLocation = useCallback(() => {
    setLat(null);
    setLng(null);
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit || !bristolScale || !mood) return;

    setSubmitting(true);
    try {
      const result = await createLog({
        bristol_scale: bristolScale,
        duration_seconds: durationSeconds,
        mood,
        note: note.trim() || null,
        lat,
        lng,
      });

      setCelebrationData(result);
      setShowCelebration(true);
    } catch (error) {
      console.error("Failed to log:", error);
      // Could show a toast here
    } finally {
      setSubmitting(false);
    }
  };

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
    // Reset form
    setBristolScale(null);
    setMood(null);
    setDurationSeconds(0);
    durationRef.current = 0;
    setNote("");
    setLat(null);
    setLng(null);
  }, []);

  return (
    <>
      <div className="mx-auto max-w-md px-6 py-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            How was it?
          </h1>
        </div>

        {/* Bristol Scale */}
        <section>
          <label
            className="mb-2 block text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            Type
          </label>
          <BristolPicker value={bristolScale} onChange={setBristolScale} />
        </section>

        {/* Duration */}
        <section>
          <label
            className="mb-2 block text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            How long?
          </label>
          <DurationPicker value={durationSeconds} onChange={handleDurationChange} />
        </section>

        {/* Mood */}
        <section>
          <label
            className="mb-2 block text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            How do you feel?
          </label>
          <MoodPicker value={mood} onChange={setMood} />
        </section>

        {/* Geotag */}
        <section>
          <GeotagToggle onLocation={handleLocation} onClear={handleClearLocation} />
        </section>

        {/* Note */}
        <section>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              color: "var(--foreground)",
              fontSize: 14,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary-light)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
        </section>

        {/* Submit button */}
        <section className="pb-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl font-bold transition-all active:scale-[0.97]"
            style={{
              height: 56,
              fontSize: 18,
              background: canSubmit ? "var(--accent)" : "var(--border)",
              color: canSubmit ? "var(--foreground)" : "var(--muted)",
              border: "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 4px 16px rgba(245, 197, 66, 0.4)" : "none",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <span
                style={{
                  display: "inline-block",
                  animation: "poop-spin 1.2s ease-in-out infinite",
                }}
              >
                Loading...
              </span>
            ) : (
              "Log It \uD83D\uDCA9"
            )}
          </button>
        </section>
      </div>

      {/* Celebration overlay */}
      {showCelebration && celebrationData && (
        <CelebrationScreen
          streak={celebrationData.streak}
          newAchievements={celebrationData.newAchievements}
          funFact={celebrationData.funFact}
          onDone={handleCelebrationDone}
          userId={userId}
        />
      )}

      <style>{`
        @keyframes poop-spin {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          75% { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>
    </>
  );
}
