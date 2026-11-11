import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../src/lib/data/cache", () => ({
  fetchJson: mocks.fetch,
  observationCache: {
    read: async (_key: string, load: () => Promise<unknown>) => ({
      value: await load(),
      retrievedAt: "2026-11-11T12:10Z",
      stale: false,
    }),
  },
}));
import { getHistory } from "../src/lib/data/history";
const required = {
  WIND: 100,
  CCGT: 100,
  OCGT: 0,
  NUCLEAR: 100,
  NPSHYD: 0,
  BIOMASS: 0,
  OTHER: 0,
  COAL: 0,
  OIL: 0,
  PS: 0,
  INTFR: 10,
};
const rows = (startTime: string) =>
  Object.entries(required).map(([fuelType, generation]) => ({
    startTime,
    fuelType,
    generation,
  }));
beforeEach(() => {
  mocks.fetch.mockReset();
});
describe("synchronized historical service", () => {
  it("keeps gaps and never fills a selected period with a future generation or old demand reading", async () => {
    mocks.fetch.mockImplementation(async (url: string) => {
      if (url.includes("FUELINST"))
        return {
          data: [...rows("2026-11-10T12:00Z"), ...rows("2026-11-11T11:35Z")],
        };
      if (url.includes("INDO"))
        return { data: [{ startTime: "2026-11-11T11:00Z", demand: 300 }] };
      if (url.includes("/regional/"))
        return {
          data: [
            {
              from: "2026-11-11T11:30Z",
              to: "2026-11-11T12:00Z",
              regions: Array.from({ length: 14 }, (_, i) => ({
                regionid: i + 1,
                shortname: "Region",
                intensity: { forecast: 0, index: "very low" },
              })),
            },
          ],
        };
      return {
        data: [
          {
            from: "2026-11-11T11:30Z",
            to: "2026-11-11T12:00Z",
            intensity: { actual: 0, index: "very low" },
          },
        ],
      };
    });
    const history = await getHistory(Date.parse("2026-11-11T12:10Z"));
    expect(history.snapshots).toHaveLength(48);
    expect(history.snapshots[0].generation?.totalMw).toBe(300);
    const last = history.snapshots.at(-1)!;
    expect(last.generation).toBeNull();
    expect(last.demand).toBeNull();
    expect(last.carbon?.intensity).toBe(0);
    expect(last.regional?.regions).toHaveLength(14);
    expect(last.mode).toBe("historical");
    expect(mocks.fetch).toHaveBeenCalledTimes(4);
  });
  it("returns explicit unavailable layers during a complete provider outage", async () => {
    mocks.fetch.mockRejectedValue(Error("outage"));
    const history = await getHistory(Date.parse("2026-11-11T12:10Z"));
    expect(
      history.snapshots.every(
        (s) =>
          s.generation === null &&
          s.demand === null &&
          s.carbon === null &&
          s.regional === null &&
          s.errors.length === 4,
      ),
    ).toBe(true);
  });
});
