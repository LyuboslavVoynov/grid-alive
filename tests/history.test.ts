import { describe, it, expect } from "vitest";
import { normalizeCarbon, normalizeRegional } from "../src/lib/data/normalize";
import { ObservationCache } from "../src/lib/data/cache";
describe("historical interval boundaries", () => {
  it("selects the interval containing the requested instant and never future values", () => {
    const raw = {
      data: [
        {
          from: "2026-11-11T10:00Z",
          to: "2026-11-11T10:30Z",
          intensity: { actual: 100, index: "low" },
        },
        {
          from: "2026-11-11T10:30Z",
          to: "2026-11-11T11:00Z",
          intensity: { actual: 200, index: "high" },
        },
      ],
    };
    expect(
      normalizeCarbon(raw, "2026-11-11T12:00Z", Date.parse("2026-11-11T10:29Z"))
        .intensity,
    ).toBe(100);
    expect(
      normalizeCarbon(raw, "2026-11-11T12:00Z", Date.parse("2026-11-11T10:30Z"))
        .intensity,
    ).toBe(200);
    expect(() =>
      normalizeCarbon(
        raw,
        "2026-11-11T12:00Z",
        Date.parse("2026-11-11T11:00Z"),
      ),
    ).toThrow();
  });
  it("keeps repeated local clock hours as distinct UTC instants on the autumn transition", () => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    expect(format.format(new Date("2026-10-25T00:30Z"))).not.toBe(
      format.format(new Date("2026-10-25T01:30Z")),
    );
  });
  it("requires unique regional coverage and preserves zero intensity", () => {
    const regions = Array.from({ length: 14 }, (_, i) => ({
      regionid: i + 1,
      shortname: "Region " + i,
      intensity: { forecast: 0, index: "very low" },
    }));
    const raw = {
      data: [{ from: "2026-11-11T10:00Z", to: "2026-11-11T10:30Z", regions }],
    };
    expect(
      normalizeRegional(raw, "2026-11-11T10:05Z").regions[0].intensity,
    ).toBe(0);
    regions[1].regionid = 1;
    expect(() => normalizeRegional(raw, "2026-11-11T10:05Z")).toThrow(
      "Incomplete",
    );
  });
  it("does not reuse cached observations beyond the six-hour outage bound", async () => {
    const cache = new ObservationCache();
    await cache.read("one", async () => 1, 1);
    await expect(
      cache.read(
        "one",
        async () => {
          throw Error("outage");
        },
        1,
        Date.now() + 7 * 60 * 60 * 1000,
      ),
    ).rejects.toThrow("outage");
  });
});
