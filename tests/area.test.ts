import { expect, it } from "vitest";
import { outwardCode, parseArea } from "../src/lib/data/area";
import { distanceKm } from "../src/lib/geo/distance";
import annual from "../data/annual-consumption.json";
it("accepts outward and complete GB postcodes while withholding inward code", () => {
  expect(outwardCode("sw1a 1aa")).toBe("SW1A");
  expect(outwardCode("EH1")).toBe("EH1");
  expect(() => outwardCode("BT1")).toThrow(/Northern Ireland/);
  expect(() => outwardCode("../api")).toThrow();
});
it("keeps modelled solar and imports separate and missing intensity null", () => {
  const r = parseArea(
    {
      data: {
        regionid: 13,
        shortname: "London",
        dnoregion: "UKPN London",
        data: [
          {
            from: "2026-11-11T12:00Z",
            to: "2026-11-11T12:30Z",
            intensity: { forecast: null },
            generationmix: [
              { fuel: "solar", perc: 20 },
              { fuel: "imports", perc: 10 },
            ],
          },
        ],
      },
    },
    "SW1A",
    "2026-11-11T12:10Z",
  );
  expect(r.intervals[0].intensity).toBeNull();
  expect(r.intervals[0].mix).toHaveLength(2);
});
it("preserves annual source totals and geographic distance", () => {
  expect(annual.length).toBeGreaterThan(300);
  for (const a of annual)
    expect(a.totalGwh).toBeCloseTo(a.domesticGwh + a.nonDomesticGwh, 3);
  expect(distanceKm([0, 51], [0, 51])).toBe(0);
  expect(distanceKm([0, 51], [0, 52])).toBeCloseTo(111.2, 0);
});
