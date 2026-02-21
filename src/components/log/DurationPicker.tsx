"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION_PRESETS } from "@/lib/constants";

interface DurationPickerProps {
  value: number;
  onChange: (seconds: number) => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const [running, setRunning] = useState(true);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);

  // Keep the ref in sync with the prop
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        valueRef.current += 1;
        onChange(valueRef.current);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onChange]);

  const handlePreset = (seconds: number) => {
    setRunning(false);
    setActivePreset(seconds);
    onChange(seconds);
  };

  const toggleTimer = () => {
    if (activePreset !== null) {
      // Resume from preset
      setActivePreset(null);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={toggleTimer}
        className="flex flex-col items-center rounded-2xl px-8 py-3 transition-all"
        style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          cursor: "pointer",
        }}
      >
        <span
          className="font-bold tabular-nums"
          style={{ fontSize: 40, color: "var(--foreground)", letterSpacing: 2 }}
        >
          {formatTime(value)}
        </span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {running ? "Tap to pause" : "Tap to resume"}
        </span>
      </button>

      <div className="flex gap-2">
        {DURATION_PRESETS.map((preset) => {
          const isActive = activePreset === preset.seconds;
          return (
            <button
              key={preset.seconds}
              type="button"
              onClick={() => handlePreset(preset.seconds)}
              className="rounded-full px-4 py-2 transition-all"
              style={{
                background: isActive ? "rgba(245, 197, 66, 0.15)" : "var(--surface)",
                border: isActive ? "2px solid var(--accent)" : "2px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: 13,
                  color: isActive ? "var(--foreground)" : "var(--muted)",
                }}
              >
                {preset.label}
              </span>
              <span
                className="ml-1"
                style={{ fontSize: 11, color: "var(--muted)" }}
              >
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
