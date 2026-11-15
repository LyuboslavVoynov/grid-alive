import { describe, it, expect } from "vitest";
import {
  type Tariff,
  weightedValue,
  taskWindows,
  cheapest,
  cleanest,
  manualRateAt,
  validateTariff,
} from "../src/lib/home/energy";
const t: Tariff = {
  name: "Test",
  kind: "tou",
  unit: 30,
  offPeak: 10,
  offStart: "22:00",
  offEnd: "07:00",
  standing: 50,
  rates: [],
  source: "test",
};
describe("household cost arithmetic", () => {
  it("integrates intervals and refuses uncovered gaps", () => {
    const p = [
      { from: "2026-11-11T20:00Z", to: "2026-11-11T20:30Z", value: 30 },
      { from: "2026-11-11T20:30Z", to: "2026-11-11T21:00Z", value: 10 },
    ];
    expect(
      weightedValue(Date.parse(p[0].from), Date.parse(p[1].to), 2, p),
    ).toBe(40);
    expect(
      weightedValue(Date.parse(p[0].from), Date.parse(p[1].to) + 1, 2, p),
    ).toBeNull();
  });
  it("compares 60p with 20p without adding daily standing charges", () => {
    const ws = taskWindows(t, 2, 1, [], Date.parse("2026-11-11T19:00Z"));
    expect(ws[0].cost).toBe(60);
    expect(cheapest(ws)?.cost).toBe(20);
    expect(cleanest(ws)).toBeNull();
  });
  it("single-rate timing changes have zero direct saving", () => {
    const ws = taskWindows(
      { ...t, kind: "single" },
      2,
      1,
      [],
      Date.parse("2026-11-11T19:00Z"),
    );
    expect(new Set(ws.map((w) => w.cost))).toEqual(new Set([60]));
  });
  it("keeps negative published prices and carbon independently", () => {
    const start = "2026-11-11T19:00Z",
      to = "2026-11-11T20:00Z";
    const ws = taskWindows(
      { ...t, kind: "published", rates: [{ from: start, to, pence: -5 }] },
      2,
      1,
      [{ from: start, to, intensity: 100 }],
      Date.parse(start),
    );
    expect(ws[0].cost).toBe(-10);
    expect(ws[0].carbon).toBe(200);
    expect(ws[1].cost).toBeNull();
  });
  it("uses London wall-clock schedules across both repeated DST hours", () => {
    const tariff = { ...t, offStart: "01:00", offEnd: "02:00" };
    expect(manualRateAt(tariff, Date.parse("2026-10-25T00:30Z"))).toBe(10);
    expect(manualRateAt(tariff, Date.parse("2026-10-25T01:30Z"))).toBe(10);
    expect(manualRateAt(tariff, Date.parse("2026-10-25T02:00Z"))).toBe(30);
    expect(() => validateTariff({ ...t, offEnd: t.offStart })).toThrow();
  });
});

it("supports carbon planning without inventing a household tariff", () => {
  const from = "2026-11-12T12:00Z",
    to = "2026-11-12T13:00Z";
  const windows = taskWindows(
    null,
    2,
    1,
    [{ from, to, intensity: 100 }],
    Date.parse(from),
  );
  expect(windows[0].cost).toBeNull();
  expect(windows[0].carbon).toBe(200);
  expect(cheapest(windows)).toBeNull();
  expect(cleanest(windows)?.carbon).toBe(200);
});
