import { it, expect } from "vitest";
import {
  parseReadings,
  dayBounds,
  summarize,
  selectPeriod,
} from "../src/lib/home/usage";
import type { Tariff } from "../src/lib/home/energy";
const t: Tariff = {
  name: "Flat",
  kind: "single",
  unit: 30,
  standing: 50,
  offPeak: 30,
  offStart: "00:00",
  offEnd: "01:00",
  rates: [],
  source: "test",
};
it("accepts quoted provider CSV and requires explicit timestamp offsets", () => {
  const data =
    'Consumption (kWh),Interval Start,Interval End\n"0.5","2026-11-10T00:00:00Z","2026-11-10T00:30:00Z"';
  expect(parseReadings(data)).toHaveLength(1);
  expect(() => parseReadings(data.replaceAll("Z", ""))).toThrow(/ISO/);
});
it("rejects overlapping, negative, unaligned and future readings", () => {
  const h = "interval_start,interval_end,consumption\n",
    r = "2026-11-10T00:00Z,2026-11-10T00:30Z,0.5\n";
  expect(() => parseReadings(h + r + r)).toThrow(/overlap/);
  expect(() => parseReadings(h + r.replace("0.5", "-1"))).toThrow();
  expect(() => parseReadings(h + r.replace("00:30Z", "01:00Z"))).toThrow();
  expect(() => parseReadings(h + r, 0)).toThrow(/future/);
});
it("counts 46 and 50 half-hour readings across clock changes and adds standing once per day", () => {
  for (const [day, count] of [
    ["2026-03-29", 46],
    ["2026-10-25", 50],
  ] as const) {
    const [from, to] = dayBounds(day);
    expect((to - from) / 1800000).toBe(count);
    const rs = Array.from({ length: count }, (_, i) => ({
      from: new Date(from + i * 1800000).toISOString(),
      to: new Date(from + (i + 1) * 1800000).toISOString(),
      kwh: 1,
    }));
    expect(summarize(rs, t)).toMatchObject({
      completeDays: 1,
      days: 1,
      standingPence: 50,
      energyPence: count * 30,
    });
    expect(selectPeriod(rs, day, 1)).toHaveLength(count);
  }
});
it("keeps partial day and missing price coverage explicit", () => {
  const rs = parseReadings(
    "interval_start,interval_end,consumption\n2026-11-10T00:00Z,2026-11-10T00:30Z,1",
  );
  expect(summarize(rs, { ...t, kind: "published", rates: [] })).toMatchObject({
    completeDays: 0,
    energyPence: null,
    covered: 0,
  });
});

it("rejects calendar dates JavaScript would silently roll into the next month", () => {
  expect(() =>
    parseReadings(
      "interval_start,interval_end,consumption\n2026-02-30T00:00Z,2026-02-30T00:30Z,1",
    ),
  ).toThrow(/calendar date/);
});
