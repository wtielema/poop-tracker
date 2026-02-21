"use client";

import { useState } from "react";

interface GeotagToggleProps {
  onLocation: (lat: number, lng: number) => void;
  onClear: () => void;
}

type GeoState = "off" | "loading" | "success" | "error";

export default function GeotagToggle({ onLocation, onClear }: GeotagToggleProps) {
  const [state, setState] = useState<GeoState>("off");

  const handleToggle = () => {
    if (state === "success") {
      setState("off");
      onClear();
      return;
    }

    if (state === "loading") return;

    setState("loading");

    if (!navigator.geolocation) {
      setState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState("success");
        onLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setState("error");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const labels: Record<GeoState, string> = {
    off: "Tag location",
    loading: "Getting location...",
    success: "Location tagged",
    error: "Location unavailable",
  };

  const icons: Record<GeoState, string> = {
    off: "📍",
    loading: "⏳",
    success: "📍",
    error: "⚠️",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex items-center gap-2 rounded-full px-4 py-2.5 transition-all"
      style={{
        background: state === "success" ? "rgba(76, 175, 80, 0.1)" : "var(--surface)",
        border:
          state === "success"
            ? "2px solid var(--success)"
            : state === "error"
              ? "2px solid var(--danger)"
              : "2px solid var(--border)",
        cursor: state === "loading" ? "wait" : "pointer",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: 16 }}>{icons[state]}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color:
            state === "success"
              ? "var(--success)"
              : state === "error"
                ? "var(--danger)"
                : "var(--muted)",
        }}
      >
        {labels[state]}
      </span>
    </button>
  );
}
