"use client";

import { BRISTOL_SCALE } from "@/lib/constants";
import type { BristolScale } from "@/lib/types";

interface BristolPickerProps {
  value: BristolScale | null;
  onChange: (v: BristolScale) => void;
}

const scales = Object.entries(BRISTOL_SCALE) as [string, { emoji: string; label: string; description: string }][];

export default function BristolPicker({ value, onChange }: BristolPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {scales.map(([key, info]) => {
        const num = Number(key) as BristolScale;
        const isSelected = value === num;

        return (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className="flex flex-col items-center justify-center rounded-xl px-1 py-3 transition-all duration-150"
            style={{
              background: isSelected ? "rgba(245, 197, 66, 0.15)" : "var(--surface)",
              border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
              transform: isSelected ? "scale(1.05)" : "scale(1)",
              boxShadow: isSelected ? "0 2px 8px rgba(245, 197, 66, 0.3)" : "var(--surface-shadow)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>{info.emoji}</span>
            <span
              className="mt-1 text-center leading-tight"
              style={{
                fontSize: 11,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "var(--foreground)" : "var(--muted)",
              }}
            >
              {info.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
