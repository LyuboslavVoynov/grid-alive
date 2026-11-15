import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../src/lib/data/cache", () => ({
  fetchJson: mocks.fetch,
  observationCache: {
    read: async (_key: string, load: () => Promise<unknown>) => ({
      value: await load(),
      retrievedAt: "2026-11-12T11:00Z",
      stale: false,
    }),
  },
}));
import {
  gridRegions,
  tariffForRegion,
  validRegionId,
} from "../src/lib/geo/regions";
import { getRegionArea } from "../src/lib/data/area";
import { GET } from "../src/app/api/area/route";
import boundaries from "../public/geo/regions.json";
beforeEach(() => mocks.fetch.mockReset());
it("matches all fourteen selection regions to the licensed geographic IDs and unique tariff areas", () => {
  expect(gridRegions.map((r) => r.id).sort((a, b) => a - b)).toEqual(
    boundaries.features.map((f) => f.properties.regionId).sort((a, b) => a - b),
  );
  expect(new Set(gridRegions.map((r) => r.tariffLetter)).size).toBe(14);
  expect(
    tariffForRegion(["E-1R-AGILE-24-10-01-A", "E-1R-AGILE-24-10-01-C"], "13"),
  ).toBe("E-1R-AGILE-24-10-01-C");
  expect(tariffForRegion([], "13")).toBeNull();
  expect(tariffForRegion(["FIRST-C", "SECOND-C"], "13")).toBeNull();
});
it("rejects unsupported or injected IDs before any upstream request", async () => {
  for (const value of ["0", "15", "13x", "../13", "013"])
    expect(() => validRegionId(value)).toThrow();
  const response = await GET(new Request("https://local/api/area?region=999"));
  expect(response.status).toBe(400);
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it("loads a selected region without transmitting a postcode or using a geocoder", async () => {
  mocks.fetch.mockResolvedValue({
    data: {
      regionid: 13,
      shortname: "London",
      dnoregion: "UKPN London",
      data: [
        {
          from: "2026-11-12T11:00Z",
          to: "2026-11-12T11:30Z",
          intensity: { forecast: 100 },
          generationmix: [
            { fuel: "wind", perc: 50 },
            { fuel: "imports", perc: 50 },
          ],
        },
      ],
    },
  });
  const r = await getRegionArea("13");
  expect(r.name).toBe("London");
  expect(r.postcode).toBe("");
  expect(r.point).not.toBeNull();
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.fetch.mock.calls[0][0]).toMatch(/fw48h\/regionid\/13$/);
  expect(mocks.fetch.mock.calls[0][0]).not.toContain("postcode");
});
it("refuses a response for a different region", async () => {
  mocks.fetch.mockResolvedValue({
    data: {
      regionid: 12,
      shortname: "Southern England",
      dnoregion: "DNO",
      data: [
        {
          from: "2026-11-12T11:00Z",
          to: "2026-11-12T11:30Z",
          intensity: { forecast: 100 },
          generationmix: [],
        },
      ],
    },
  });
  await expect(getRegionArea("13")).rejects.toThrow(/mismatch/);
});
