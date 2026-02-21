"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapPin, FriendPin } from "@/app/actions/map";

const PoopMap = dynamic(() => import("@/components/map/PoopMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{
        height: "calc(100vh - 180px)",
        background: "var(--surface)",
      }}
    >
      <div className="text-center">
        <div style={{ fontSize: 40 }}>{"\u{1F5FA}\uFE0F"}</div>
        <p
          className="mt-2"
          style={{ fontSize: 14, color: "var(--muted)" }}
        >
          Loading map...
        </p>
      </div>
    </div>
  ),
});

interface MapPageClientProps {
  pins: MapPin[];
  friendPins: FriendPin[];
}

export default function MapPageClient({
  pins,
  friendPins,
}: MapPageClientProps) {
  const [showFriends, setShowFriends] = useState(true);

  if (pins.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center px-8"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <div style={{ fontSize: 64 }}>{"\u{1F4A9}"}</div>
        <h2
          className="mt-4 font-bold"
          style={{ fontSize: 20, color: "var(--foreground)" }}
        >
          No geotagged logs yet!
        </h2>
        <p
          className="mt-2"
          style={{ fontSize: 15, color: "var(--muted)", maxWidth: 280 }}
        >
          Enable {"\u{1F4CD}"} when logging to see your poop map {"\u{1F5FA}\uFE0F"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      {/* Toggle bar */}
      {friendPins.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl mb-3"
          style={{
            background: "var(--surface)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {"\u{1F465}"} Show friends
          </span>
          <button
            type="button"
            onClick={() => setShowFriends(!showFriends)}
            className="relative rounded-full transition-colors"
            style={{
              width: 48,
              height: 28,
              background: showFriends ? "var(--primary)" : "var(--border)",
            }}
          >
            <span
              className="absolute rounded-full transition-transform"
              style={{
                width: 22,
                height: 22,
                top: 3,
                left: showFriends ? 23 : 3,
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ minHeight: 300 }}>
        <PoopMap
          pins={pins}
          friendPins={friendPins}
          showFriends={showFriends}
        />
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center justify-center gap-4 mt-3 py-2 rounded-xl"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          {"\u{1F4CD}"} {pins.length} pin{pins.length !== 1 ? "s" : ""}
        </span>
        {showFriends && friendPins.length > 0 && (
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {"\u{1F465}"} {friendPins.length} friend pin
            {friendPins.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
