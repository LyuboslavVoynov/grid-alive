import { describe, expect, it } from "vitest";
import { energyAssets } from "../src/lib/geo/assets";
import {
  sourceCoverage,
  sourceInventory,
  sourceMarkers,
} from "../src/lib/geo/source-map";
import type { Point } from "../src/lib/geo/scene";
const project = ([x, y]: Point): Point => [400 + x * 30, 400 - (y - 54) * 30];

describe("source-linked station inventory", () => {
  it("includes every extracted GB major-producer gas, nuclear and oil record with dated provenance", () => {
    for (const [fuel, count] of [
      ["gas", 49],
      ["nuclear", 5],
      ["oil", 14],
    ] as const) {
      const sites = sourceInventory(fuel);
      expect(sites).toHaveLength(count);
      expect(new Set(sites.map((a) => a.id)).size).toBe(count);
      for (const site of sites) {
        expect(["England", "Scotland", "Wales"]).toContain(site.country);
        expect(site.source).toContain("DUKES");
        expect(site.snapshot).toBe("May 2026");
        expect(site.capacityMw).toBeGreaterThan(0);
        expect(site.point.every(Number.isFinite)).toBe(true);
        expect(site.point[0]).toBeGreaterThan(-9);
        expect(site.point[1]).toBeGreaterThan(49);
        expect(site.point[1]).toBeLessThan(61);
        expect(site).not.toHaveProperty("outputMw");
        expect(site).not.toHaveProperty("generatingNow");
      }
    }
    expect(sourceCoverage("gas")).toContain("Major power producers");
    expect(
      sourceInventory("gas").some((a) => a.id.startsWith("dukes-OIL")),
    ).toBe(false);
  });
  it("retains the renewable reference records and returns no invented match for other or coal", () => {
    expect(sourceInventory("wind").some((a) => a.name === "Seagreen")).toBe(
      true,
    );
    expect(sourceInventory("other")).toEqual([]);
    expect(sourceInventory("coal")).toEqual([]);
    expect(sourceInventory(null)).toHaveLength(energyAssets.length);
    expect(new Set(energyAssets.map((a) => a.id)).size).toBe(
      energyAssets.length,
    );
  });
});
describe("shared source-marker geometry", () => {
  it("represents each visible record once, without overlapping 44px click targets", () => {
    for (const fuel of [null, "gas", "wind", "nuclear"] as const) {
      const groups = sourceMarkers(fuel, project, 1000, 900);
      const actual = groups.flatMap((g) => g.assets.map((a) => a.id)).sort();
      const expected = sourceInventory(fuel)
        .filter((a) => {
          const p = project(a.point);
          return p[0] >= 22 && p[1] >= 22 && p[0] <= 978 && p[1] <= 878;
        })
        .map((a) => a.id)
        .sort();
      expect(actual).toEqual(expected);
      expect(new Set(actual).size).toBe(actual.length);
      for (let i = 0; i < groups.length; i++)
        for (let j = 0; j < i; j++)
          expect(
            Math.hypot(
              groups[i].screen[0] - groups[j].screen[0],
              groups[i].screen[1] - groups[j].screen[1],
            ),
          ).toBeGreaterThanOrEqual(48);
    }
  });
  it("keeps membership and positions coherent during panning and reveals more groups when zooming", () => {
    const before = sourceMarkers("gas", project, 1000, 900);
    const after = sourceMarkers(
      "gas",
      (p) => {
        const q = project(p);
        return [q[0] + 25, q[1] + 10];
      },
      1000,
      900,
    );
    expect(after.map((g) => g.id)).toEqual(before.map((g) => g.id));
    after.forEach((g, i) => {
      expect(g.screen[0]).toBeCloseTo(before[i].screen[0] + 25);
      expect(g.screen[1]).toBeCloseTo(before[i].screen[1] + 10);
    });
    const spread = sourceMarkers(
      "gas",
      ([x, y]) => [1200 + x * 100, 1200 - (y - 54) * 100],
      3000,
      3000,
    );
    expect(spread.length).toBeGreaterThan(before.length);
  });
  it("keeps co-located Heysham units in an explorable group and handles empty views", () => {
    const groups = sourceMarkers(
      "nuclear",
      ([x, y]) => [1200 + x * 100, 1200 - (y - 54) * 100],
      3000,
      3000,
    );
    const heysham = groups.find((g) =>
      g.assets.some((a) => a.name === "Heysham 1"),
    );
    expect(heysham?.assets.map((a) => a.name).sort()).toEqual([
      "Heysham 1",
      "Heysham 2",
    ]);
    expect(sourceMarkers("other", project, 1000, 900)).toEqual([]);
    expect(sourceMarkers("gas", () => [-100, -100], 1000, 900)).toEqual([]);
    expect(sourceMarkers("gas", () => [NaN, NaN], 1000, 900)).toEqual([]);
  });
});
