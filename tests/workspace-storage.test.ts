import { it, expect } from "vitest";
import { decodeHomeState } from "../src/lib/home/storage";
const legacy = {
  version: 1,
  tariff: null,
  readings: [],
  pricePlan: null,
  carbonPlan: null,
};
it("restores previous saved workspaces without requiring a new region field", () =>
  expect(decodeHomeState(JSON.stringify(legacy)).regionId).toBe(""));
it("preserves a valid selected region and rejects unsupported ones", () => {
  expect(
    decodeHomeState(JSON.stringify({ ...legacy, regionId: "13" })).regionId,
  ).toBe("13");
  expect(() =>
    decodeHomeState(JSON.stringify({ ...legacy, regionId: "999" })),
  ).toThrow();
});
it("preserves public tariff metadata for selection-only reloads", () => {
  const tariff = {
    name: "Flexible · London",
    kind: "published",
    unit: 0,
    offPeak: 0,
    offStart: "00:00",
    offEnd: "00:30",
    standing: 40,
    rates: [{ from: "2026-11-10T00:00Z", to: "2026-11-14T00:00Z", pence: 25 }],
    source: "Public",
    regionId: "13",
    productCode: "VAR-22-11-01",
    tariffCode: "E-1R-VAR-22-11-01-C",
    supplier: "OCTOPUS_ENERGY",
  };
  expect(
    decodeHomeState(JSON.stringify({ ...legacy, tariff })).tariff?.tariffCode,
  ).toBe(tariff.tariffCode);
});

it("restores task selections and safely keeps unfinished exact-value drafts", () => {
  const taskDraft = {
    task: "EV charging",
    kwh: "20",
    hours: "3",
    deadline: "12",
  };
  expect(
    decodeHomeState(JSON.stringify({ ...legacy, taskDraft })).taskDraft,
  ).toEqual(taskDraft);
  expect(
    decodeHomeState(
      JSON.stringify({ ...legacy, taskDraft: { ...taskDraft, kwh: "" } }),
    ).taskDraft.kwh,
  ).toBe("");
  expect(decodeHomeState(JSON.stringify(legacy)).taskDraft.task).toBe(
    "Laundry",
  );
});
