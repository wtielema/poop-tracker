/**
 * Geographic utility functions.
 * Extracted from PoopMap.tsx so they can be tested without React/Leaflet dependencies.
 */

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

/**
 * Check if two points are within a given distance (in meters).
 */
export function isWithinDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  maxMeters: number
): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= maxMeters;
}
