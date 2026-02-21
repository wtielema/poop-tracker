"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BRISTOL_SCALE, MOODS } from "@/lib/constants";
import { haversineDistance } from "@/lib/geo";
import type { BristolScale, Mood } from "@/lib/types";

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  bristol_scale: BristolScale;
  mood: Mood;
  logged_at: string;
}

export interface FriendPin {
  lat: number;
  lng: number;
  friendUsername: string;
  friendAvatar: string;
}

interface PoopMapProps {
  pins: Pin[];
  friendPins: FriendPin[];
  showFriends: boolean;
}

function createPoopIcon(hasBuddy: boolean) {
  return L.divIcon({
    html: `<div style="font-size: 28px; line-height: 1; position: relative; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      \u{1F4A9}${hasBuddy ? '<span style="position: absolute; top: -8px; right: -12px; font-size: 16px;">\u{1F91D}</span>' : ""}
    </div>`,
    className: "poop-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createFriendIcon(avatar: string) {
  return L.divIcon({
    html: `<div style="font-size: 20px; line-height: 1; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2)); background: var(--surface, #fff); border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent, #F5C542);">
      ${avatar}
    </div>`,
    className: "friend-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMoodLabel(mood: Mood): string {
  const found = MOODS.find((m) => m.emoji === mood);
  return found ? found.label : "";
}

// Component to auto-fit bounds
function FitBounds({ pins, friendPins, showFriends }: PoopMapProps) {
  const map = useMap();

  useEffect(() => {
    const allPoints: [number, number][] = pins.map((p) => [p.lat, p.lng]);

    if (showFriends) {
      friendPins.forEach((fp) => allPoints.push([fp.lat, fp.lng]));
    }

    if (allPoints.length === 0) return;

    if (allPoints.length === 1) {
      map.setView(allPoints[0], 14);
    } else {
      const bounds = L.latLngBounds(
        allPoints.map(([lat, lng]) => L.latLng(lat, lng))
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, pins, friendPins, showFriends]);

  return null;
}

export default function PoopMap({
  pins,
  friendPins,
  showFriends,
}: PoopMapProps) {
  // Calculate which pins have a Poop Buddy nearby
  const buddySet = useMemo(() => {
    const set = new Set<string>();
    if (!showFriends) return set;

    for (const pin of pins) {
      for (const fp of friendPins) {
        const dist = haversineDistance(pin.lat, pin.lng, fp.lat, fp.lng);
        if (dist <= 100) {
          set.add(pin.id);
          break;
        }
      }
    }
    return set;
  }, [pins, friendPins, showFriends]);

  // Default center: most recent pin or world view
  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [20, 0];

  const zoom = pins.length > 0 ? 12 : 4;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", borderRadius: 12 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds pins={pins} friendPins={friendPins} showFriends={showFriends} />

      {/* User pins */}
      {pins.map((pin) => {
        const bristol = BRISTOL_SCALE[pin.bristol_scale];
        const hasBuddy = buddySet.has(pin.id);

        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createPoopIcon(hasBuddy)}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: "inherit" }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#666",
                    marginBottom: 6,
                  }}
                >
                  {formatDate(pin.logged_at)}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{bristol.emoji}</span>
                  <span>Type {pin.bristol_scale}: {bristol.label}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{pin.mood}</span>
                  <span>{getMoodLabel(pin.mood)}</span>
                </div>
                {hasBuddy && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: "#FFF3D0",
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {"\u{1F91D}"} Poop Buddies! A friend was nearby
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Friend pins */}
      {showFriends &&
        friendPins.map((fp, i) => (
          <Marker
            key={`friend-${i}`}
            position={[fp.lat, fp.lng]}
            icon={createFriendIcon(fp.friendAvatar)}
          >
            <Popup>
              <div style={{ fontFamily: "inherit", fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>{fp.friendAvatar}</span>{" "}
                <strong>@{fp.friendUsername}</strong>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
