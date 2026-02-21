"use client";

import { MOODS } from "@/lib/constants";
import type { Mood } from "@/lib/types";

interface MoodPickerProps {
  value: Mood | null;
  onChange: (m: Mood) => void;
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex justify-between gap-2">
      {MOODS.map(({ emoji, label }) => {
        const isSelected = value === emoji;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className="flex flex-1 flex-col items-center rounded-xl py-3 transition-all duration-150"
            style={{
              background: isSelected ? "rgba(245, 197, 66, 0.15)" : "var(--surface)",
              border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
              transform: isSelected ? "scale(1.08)" : "scale(1)",
              boxShadow: isSelected ? "0 2px 8px rgba(245, 197, 66, 0.3)" : "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
            <span
              className="mt-1"
              style={{
                fontSize: 11,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "var(--foreground)" : "var(--muted)",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
