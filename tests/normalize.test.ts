import { describe, it, expect } from "vitest";
import {
  normalizeGeneration,
  normalizeCarbon,
  normalizeDemand,
} from "../src/lib/data/normalize";
const from = "2026-11-11T14:00:00Z",
  retrieved = "2026-11-11T14:06:00Z";
function fixture() {
  return {
    data: Object.entries({
      WIND: 1000,
      CCGT: 1000,
      OCGT: 0,
      NUCLEAR: 1000,
      NPSHYD: 0,
      BIOMASS: 0,
      OTHER: 0,
      COAL: 0,
      OIL: 0,
      PS: -200,
      INTFR: 500,
      INTNED: -100,
    }).map(([fuelType, generation]) => ({
      startTime: from,
      fuelType,
      generation,
    })),
  };
}
describe("generation accounting", () => {
  it("keeps signed storage and imports outside the percentage denominator", () => {
    const g = normalizeGeneration(
      fixture(),
      retrieved,
      undefined,
      Date.parse(retrieved),
    );
    expect(g.totalMw).toBe(3000);
    expect(g.storageMw).toBe(-200);
    expect(g.netImportsMw).toBe(400);
    expect(g.fuels.reduce((s, f) => s + f.share, 0)).toBeCloseTo(100);
    expect(g.fuels.some((f) => f.key === "solar")).toBe(false);
  });
  it("does not duplicate revised values", () => {
    const raw = fixture();
    raw.data.push({ startTime: from, fuelType: "WIND", generation: 2000 });
    expect(normalizeGeneration(raw, retrieved).totalMw).toBe(4000);
  });
  it("retains previously unknown provider fuels", () => {
    const raw = fixture();
    raw.data.push({ startTime: from, fuelType: "NEWFUEL", generation: 500 });
    expect(
      normalizeGeneration(raw, retrieved).fuels.find((f) => f.key === "newfuel")
        ?.mw,
    ).toBe(500);
  });
  it("rejects incomplete latest snapshots rather than inventing missing fuel values", () => {
    const raw = fixture();
    raw.data.push({
      startTime: "2026-11-11T14:05:00Z",
      fuelType: "WIND",
      generation: 500,
    });
    expect(() => normalizeGeneration(raw, retrieved)).toThrow("Incomplete");
  });
  it("marks genuinely old observations stale and rejects negative non-storage generation", () => {
    expect(
      normalizeGeneration(
        fixture(),
        retrieved,
        undefined,
        Date.parse("2026-11-11T15:00Z"),
      ).stale,
    ).toBe(true);
    const raw = fixture();
    raw.data[0].generation = -1;
    expect(() => normalizeGeneration(raw, retrieved)).toThrow("Negative");
  });
  it("refuses to carry observations through historical gaps", () => {
    expect(() =>
      normalizeGeneration(
        fixture(),
        retrieved,
        Date.parse("2026-11-11T14:20Z"),
      ),
    ).toThrow("Gap");
  });
});
describe("carbon and demand quality", () => {
  it("preserves zero carbon as an estimate and uses forecast only when actual is missing", () => {
    const raw = {
      data: [
        {
          from,
          to: "2026-11-11T14:30Z",
          intensity: { actual: 0, forecast: 10, index: "very low" },
        },
      ],
    };
    expect(normalizeCarbon(raw, retrieved).intensity).toBe(0);
    expect(normalizeCarbon(raw, retrieved).quality).toBe("estimated");
    raw.data[0].intensity.actual = null as unknown as number;
    expect(normalizeCarbon(raw, retrieved).quality).toBe("forecast");
  });
  it("never uses current demand outside its historical settlement period", () => {
    const raw = { data: [{ startTime: from, demand: 30000 }] };
    expect(() =>
      normalizeDemand(raw, retrieved, Date.parse("2026-11-11T14:30Z")),
    ).toThrow("unavailable");
  });
});
