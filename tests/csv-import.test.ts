import { it, expect } from "vitest";
import {
  detectConsumptionColumns,
  inspectConsumptionCsv,
  parseMappedReadings,
} from "../src/lib/home/csv-import";
const csv =
  '"Recorded beginning","Recorded ending","Energy (Wh)",Note\n2026-11-10T00:00Z,2026-11-10T00:30Z,500,"quoted, note"\n2026-11-10T00:30Z,2026-11-10T01:00Z,750,=NOT_EXECUTED()';
it("previews headers safely and lets selections map unfamiliar supplier columns", () => {
  const info = inspectConsumptionCsv(csv);
  expect(info.count).toBe(2);
  expect(info.sample[0][3]).toBe("quoted, note");
  expect(detectConsumptionColumns(info.headers)).toBeNull();
  const r = parseMappedReadings(csv, { from: 0, to: 1, energy: 2, unit: "wh" });
  expect(r.map((v) => v.kwh)).toEqual([0.5, 0.75]);
});
it("detects known headers and Wh without guessing duplicate columns", () => {
  expect(
    detectConsumptionColumns([
      "Consumption (Wh)",
      "Interval Start",
      "Interval End",
    ]),
  ).toEqual({ from: 1, to: 2, energy: 0, unit: "wh" });
  expect(detectConsumptionColumns(["From", "From", "To", "kWh"])).toBeNull();
});
it("rejects duplicate and out-of-range column selections", () => {
  expect(() =>
    parseMappedReadings(csv, { from: 0, to: 0, energy: 2, unit: "wh" }),
  ).toThrow(/different columns/);
  expect(() =>
    parseMappedReadings(csv, { from: 0, to: 1, energy: 99, unit: "kwh" }),
  ).toThrow();
});
it("retains strict interval and explicit-timezone validation after mapping", () => {
  expect(() =>
    parseMappedReadings(csv.replaceAll("Z", ""), {
      from: 0,
      to: 1,
      energy: 2,
      unit: "wh",
    }),
  ).toThrow(/ISO timestamps/);
  expect(() =>
    parseMappedReadings(csv.replace(",500,", ",,"), {
      from: 0,
      to: 1,
      energy: 2,
      unit: "wh",
    }),
  ).toThrow();
});
