import { describe, it, expect } from "vitest";
import {
  countryTransfers,
  interconnectors,
} from "../src/lib/geo/interconnectors";
describe("country transfers", () => {
  it("keeps opposite cable flows separate within one country", () => {
    const france = countryTransfers({
      INTFR: 1000,
      INTIFA2: -500,
      INTELEC: 200,
    }).find((c) => c.country === "France")!;
    expect(france.importsMw).toBe(1200);
    expect(france.exportsMw).toBe(500);
    expect(france.netMw).toBe(700);
    expect(france.missing).toBe(0);
  });
  it("distinguishes a missing reading from a measured zero and excludes invalid values", () => {
    const france = countryTransfers({ INTFR: 0, INTIFA2: NaN }).find(
      (c) => c.country === "France",
    )!;
    expect(france.links.map((l) => l.mw)).toEqual([0, null, null]);
    expect(france.missing).toBe(2);
  });
  it("groups Irish cables without merging Northern Ireland and retains unknown codes", () => {
    const groups = countryTransfers({
      INTEW: 500,
      INTGRNL: -100,
      INTIRL: 50,
      INTNEW: 60,
    });
    expect(groups.find((c) => c.country === "Ireland")?.importsMw).toBe(500);
    expect(groups.find((c) => c.country === "Ireland")?.exportsMw).toBe(100);
    expect(
      groups.find((c) => c.country === "Northern Ireland")?.importsMw,
    ).toBe(50);
    expect(groups.find((c) => c.country.includes("INTNEW"))?.importsMw).toBe(
      60,
    );
  });
  it("conserves reported imports and exports across country grouping", () => {
    const flows = Object.fromEntries(
      interconnectors.map((l, i) => [l.id, (i % 2 ? -1 : 1) * (i + 1) * 100]),
    );
    const groups = countryTransfers(flows);
    expect(groups.reduce((s, c) => s + c.netMw, 0)).toBe(
      Object.values(flows).reduce((s, v) => s + v, 0),
    );
    expect(groups.reduce((s, c) => s + c.importsMw, 0)).toBe(
      Object.values(flows).reduce((s, v) => s + Math.max(0, v), 0),
    );
  });
});
