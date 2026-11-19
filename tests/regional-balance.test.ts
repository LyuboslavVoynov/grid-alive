import { expect, it, vi } from "vitest";
import { areaInterval, balanceMix } from "../src/lib/geo/balance";
import type { AreaData } from "../src/types/area";
import type { Generation } from "../src/types/electricity";
import config from "../next.config";
import { GET } from "../src/app/api/area/route";
const area: AreaData = {
  regionId: 13,
  name: "London",
  dno: "London",
  retrievedAt: "2026-11-16T12:10Z",
  stale: false,
  point: [0, 51.5],
  warnings: [],
  intervals: [
    {
      from: "2026-11-16T12:00Z",
      to: "2026-11-16T12:30Z",
      intensity: 100,
      mix: [
        { fuel: "solar", perc: 20 },
        { fuel: "imports", perc: 80 },
      ],
    },
  ],
};
it("does not show another region, future mix or an expired interval under the selected region", () => {
  expect(areaInterval(area, "13", "2026-11-16T12:00Z")).toBe(area.intervals[0]);
  expect(areaInterval(area, "13", "2026-11-16T12:29Z")).toBe(area.intervals[0]);
  expect(areaInterval(area, "12", "2026-11-16T12:10Z")).toBeNull();
  expect(areaInterval(area, "13", "2026-11-16T11:59Z")).toBeNull();
  expect(areaInterval(area, "13", "2026-11-16T12:30Z")).toBeNull();
});
it("keeps modelled regional percentages separate from national MW", () => {
  const national = {
    fuels: [
      { key: "wind", label: "Wind", share: 40, mw: 12000, color: "cyan" },
    ],
    totalMw: 30000,
  } as Generation;
  const regional = balanceMix("13", area.intervals[0], national);
  expect(regional[0].fuel).toBe("imports");
  expect(regional[0].perc).toBe(80);
  expect(regional.every((r) => r.mw === undefined)).toBe(true);
  expect(balanceMix("13", null, national)).toEqual([]);
  expect(balanceMix("", null, national)[0].mw).toBe(12000);
});
it("redirects retired page URLs to the matching single-page tools", async () => {
  const redirects = await (
    config.redirects as () => Promise<{ source: string; destination: string }[]>
  )();
  expect(redirects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        source: "/area",
        destination: "/?tool=demand",
      }),
      expect.objectContaining({
        source: "/home",
        destination: "/?tool=energy",
      }),
      expect.objectContaining({
        source: "/methodology",
        destination: "/?tool=methodology",
      }),
    ]),
  );
});
it("rejects the retired typed-postcode API before making any upstream request", async () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  const response = await GET(
    new Request("https://local/api/area?postcode=SW1A"),
  );
  expect(response.status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockRestore();
});

import { planningCarbon } from "../src/lib/home/carbon-source";
it("never silently substitutes national carbon for a selected regional planning forecast", () => {
  const national = [{ at: "2026-11-16T12:00Z", value: 250 }];
  expect(planningCarbon("13", null, national).rates).toEqual([]);
  expect(planningCarbon("12", area, national).rates).toEqual([]);
  expect(
    planningCarbon("13", { ...area, stale: true }, national).rates,
  ).toEqual([]);
  expect(planningCarbon("13", area, national, true).rates).toEqual([]);
  expect(planningCarbon("13", area, national).rates[0].intensity).toBe(100);
  expect(planningCarbon("", area, national).rates[0].intensity).toBe(250);
});
