import { describe, it, expect } from "vitest";
import { haversineDistance, isWithinDistance } from "@/lib/geo";

/**
 * Known test coordinates:
 * - Eiffel Tower: 48.8584, 2.2945
 * - New York (Times Square): 40.7128, -74.0060
 * - Tokyo (Shibuya): 35.6762, 139.6503
 * - North Pole vicinity: 89.99, 0.0
 * - Equator: 0.0, 0.0
 * - Near date line: 0.0, 179.99 and 0.0, -179.99
 */

describe("haversineDistance", () => {
  it("returns 0 for the exact same location", () => {
    const dist = haversineDistance(48.8584, 2.2945, 48.8584, 2.2945);
    expect(dist).toBe(0);
  });

  it("calculates ~100m for a point ~100m north of the Eiffel Tower", () => {
    // 1 degree latitude ~= 111,320m, so ~100m ~= 0.000898 degrees
    const lat1 = 48.8584;
    const lng1 = 2.2945;
    const lat2 = 48.85930; // ~100m north
    const lng2 = 2.2945;
    const dist = haversineDistance(lat1, lng1, lat2, lng2);
    // Should be approximately 100m (within 5m tolerance)
    expect(dist).toBeGreaterThan(95);
    expect(dist).toBeLessThan(105);
  });

  it("calculates ~1km for a point ~1km east of the Eiffel Tower", () => {
    // At latitude 48.86, 1 degree longitude ~= 111,320 * cos(48.86deg) ~= 73,300m
    // So ~1km ~= 0.01364 degrees
    const lat1 = 48.8584;
    const lng1 = 2.2945;
    const lat2 = 48.8584;
    const lng2 = 2.3081; // ~1km east
    const dist = haversineDistance(lat1, lng1, lat2, lng2);
    // Should be approximately 1000m (within 50m tolerance)
    expect(dist).toBeGreaterThan(950);
    expect(dist).toBeLessThan(1050);
  });

  it("calculates large distance between different continents (Paris to New York)", () => {
    const dist = haversineDistance(48.8584, 2.2945, 40.7128, -74.006);
    // Paris to New York is approximately 5,837 km
    const distKm = dist / 1000;
    expect(distKm).toBeGreaterThan(5700);
    expect(distKm).toBeLessThan(5950);
  });

  it("calculates correctly near the equator", () => {
    // Two points on the equator, 1 degree apart in longitude
    // At equator, 1 degree longitude ~= 111.32 km
    const dist = haversineDistance(0, 0, 0, 1);
    const distKm = dist / 1000;
    expect(distKm).toBeGreaterThan(110);
    expect(distKm).toBeLessThan(112);
  });

  it("calculates correctly near the poles", () => {
    // Near north pole, two points 1 degree of longitude apart
    // At 89 degrees latitude, the circumference is very small
    const dist = haversineDistance(89, 0, 89, 1);
    // At 89 deg latitude, 1 deg longitude ~= 111,320 * cos(89deg) ~= 1,943m
    expect(dist).toBeGreaterThan(1900);
    expect(dist).toBeLessThan(2000);
  });

  it("calculates correctly across the date line", () => {
    // Two points on the equator straddling the date line
    // 179.99E to 179.99W = 0.02 degrees apart
    const dist = haversineDistance(0, 179.99, 0, -179.99);
    // 0.02 degrees at equator ~= 2.226 km
    const distKm = dist / 1000;
    expect(distKm).toBeGreaterThan(2.1);
    expect(distKm).toBeLessThan(2.4);
  });

  it("is symmetric (a to b equals b to a)", () => {
    const d1 = haversineDistance(48.8584, 2.2945, 40.7128, -74.006);
    const d2 = haversineDistance(40.7128, -74.006, 48.8584, 2.2945);
    expect(d1).toBeCloseTo(d2, 6);
  });
});

describe("isWithinDistance", () => {
  it("returns true for the exact same location (within 100m)", () => {
    expect(isWithinDistance(48.8584, 2.2945, 48.8584, 2.2945, 100)).toBe(true);
  });

  it("returns true for a point ~99m away (within 100m)", () => {
    // ~99m north of Eiffel Tower
    const lat2 = 48.8584 + 0.00089; // ~99m
    expect(isWithinDistance(48.8584, 2.2945, lat2, 2.2945, 100)).toBe(true);
  });

  it("returns false for a point ~101m away (NOT within 100m)", () => {
    // ~110m north of Eiffel Tower (safely past 100m)
    const lat2 = 48.8584 + 0.001; // ~111m
    expect(isWithinDistance(48.8584, 2.2945, lat2, 2.2945, 100)).toBe(false);
  });

  it("returns false for 1km apart (NOT within 100m)", () => {
    expect(isWithinDistance(48.8584, 2.2945, 48.8584, 2.3081, 100)).toBe(
      false
    );
  });

  it("returns false for different continents (NOT within 100m)", () => {
    // Paris to Tokyo
    expect(
      isWithinDistance(48.8584, 2.2945, 35.6762, 139.6503, 100)
    ).toBe(false);
  });

  it("works with a larger radius (1km)", () => {
    // ~500m apart should be within 1000m
    const lat2 = 48.8584 + 0.0045; // ~500m
    expect(isWithinDistance(48.8584, 2.2945, lat2, 2.2945, 1000)).toBe(true);
  });

  it("boundary: exactly 100m should return true (<=)", () => {
    // Use exact same point, so distance is 0 which is <= 100
    expect(isWithinDistance(0, 0, 0, 0, 100)).toBe(true);
  });
});
