import { it, expect } from "vitest";
import assets from "../data/renewable-assets.json";
import regions from "../public/geo/regions.json";
it("ships unique GB operational reference points and reports capacity as static metadata", () => {
  expect(assets.length).toBeGreaterThan(50);
  expect(new Set(assets.map((a) => a.id)).size).toBe(assets.length);
  for (const a of assets) {
    expect(["England", "Scotland", "Wales"]).toContain(a.country);
    expect(a.capacityMw).toBeGreaterThan(0);
    expect(a.point[0]).toBeGreaterThan(-9);
    expect(a.point[0]).toBeLessThan(4);
    expect(a.point[1]).toBeGreaterThan(49);
    expect(a.point[1]).toBeLessThan(61);
  }
});
it("maps each of the fourteen DNO licence areas to exactly one Carbon Intensity region", () => {
  expect(regions.features).toHaveLength(14);
  expect(
    regions.features.map((f) => f.properties.regionId).sort((a, b) => a - b),
  ).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  for (const f of regions.features) {
    for (const polygon of f.geometry.coordinates) {
      for (const ring of polygon) {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring.at(-1));
        expect(Math.abs(ring[0][0])).toBeLessThan(10);
        expect(ring[0][1]).toBeGreaterThan(49);
      }
    }
  }
});
