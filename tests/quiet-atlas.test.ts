import { describe, expect, it } from "vitest";
import {
  countryCorridors,
  geographicArc,
  pointAlong,
  projectArc,
  transferState,
} from "../src/lib/geo/quiet-atlas";

describe("Quiet Atlas route integrity", () => {
  it("uses exact geographic endpoints, finite arcs and the same projected polyline for packets", () => {
    for (const corridor of countryCorridors) {
      const arc = geographicArc(corridor.from, corridor.to);
      expect(arc[0]).toEqual(corridor.from);
      expect(arc.at(-1)).toEqual(corridor.to);
      expect(arc.flat().every(Number.isFinite)).toBe(true);
      const route = projectArc(arc, ([x, y]) => [x * 10, y * 10]);
      expect(pointAlong(route, 0)).toEqual(route.points[0]);
      expect(pointAlong(route, 1)).toEqual(route.points.at(-1));
      // Every packet sits on one of the exact segments drawn on screen.
      for (const t of [0.1, 0.37, 0.6, 0.9]) {
        const point = pointAlong(route, t);
        const i = route.distances.findIndex((d) => d >= route.length * t);
        const a = route.points[i - 1],
          b = route.points[i];
        expect(
          (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]),
        ).toBeCloseTo(0, 8);
      }
    }
  });
  it("keeps packet progress stable through pan/zoom and samples by distance", () => {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [10, 0],
    ];
    const route = projectArc(points, (p) => p);
    expect(pointAlong(route, 0.5)).toEqual([5, 0]);
    const moved = projectArc(points, ([x, y]) => [x * 2 + 25, y * 2 - 10]);
    expect(pointAlong(moved, 0.5)).toEqual([35, -10]);
  });
  it("preserves gross opposing directions and suppresses stale, partial, zero and invalid readings", () => {
    const flows = { INTFR: 1000, INTIFA2: -500, INTELEC: 200 };
    expect(transferState(flows, "France", "import", false)).toMatchObject({
      mw: 1200,
      active: true,
    });
    expect(transferState(flows, "France", "export", false)).toMatchObject({
      mw: 500,
      active: true,
    });
    expect(transferState(flows, "France", "import", true).active).toBe(false);
    for (const readings of [
      {},
      { INTFR: 100 },
      { INTFR: 0, INTIFA2: 0, INTELEC: 0 },
      { INTFR: 100, INTIFA2: NaN, INTELEC: 0 },
    ] as Record<string, number>[])
      expect(transferState(readings, "France", "import", false).active).toBe(
        false,
      );
    expect(transferState(flows, "Unknown", "import", false).active).toBe(false);
  });
});
