import { tariffRates, weightedValue, type Tariff } from "./energy";
export type Reading = { from: string; to: string; kwh: number };
const zone = "Europe/London";
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: zone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hours = new Intl.DateTimeFormat("en-GB", {
  timeZone: zone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function dayKey(at: string | number) {
  const p = dateFormat.formatToParts(
    typeof at === "string" ? new Date(at) : at,
  );
  return `${p.find((v) => v.type === "year")!.value}-${p.find((v) => v.type === "month")!.value}-${p.find((v) => v.type === "day")!.value}`;
}
export function dayBounds(key: string): [number, number] {
  const raw = Date.parse(key + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(raw))
    throw Error("Invalid date");
  const midnight = (utc: number) => {
    for (const v of [utc - 3600000, utc])
      if (hours.format(v) === "00:00") return v;
    throw Error("Invalid London midnight");
  };
  return [midnight(raw), midnight(raw + 86400000)];
}
/** RFC4180-style quoted fields, bounded by caller. No formulas are evaluated. */
export function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export function parseReadings(text: string, now = Date.now()): Reading[] {
  if (text.length > 2_000_000) throw Error("Use a CSV smaller than 2 MB.");
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2)
    throw Error("Add at least one half-hour reading below the header.");
  if (rows.length > 35041)
    throw Error("Import at most 35,040 half-hour readings at once.");
  const header = rows.shift()!.map((v) =>
    v
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""),
  );
  const find = (keys: string[]) => header.findIndex((h) => keys.includes(h));
  const start = find(["intervalstart", "start", "from"]),
    end = find(["intervalend", "end", "to"]),
    energy = find(["consumption", "consumptionkwh", "kwh"]);
  if (start < 0 || end < 0 || energy < 0)
    throw Error(
      "CSV needs interval_start, interval_end and consumption (kWh) columns.",
    );
  const out: Reading[] = rows
    .map((r, i) => {
      const f = r[start]?.trim(),
        t = r[end]?.trim(),
        value = r[energy]?.trim();
      const timezone =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i;
      if (!f || !t || !timezone.test(f) || !timezone.test(t))
        throw Error(
          `Row ${i + 2}: use ISO timestamps with Z or an explicit UTC offset.`,
        );
      const a = Date.parse(f),
        b = Date.parse(t);
      if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        b - a !== 1800000 ||
        a % 1800000 !== 0
      )
        throw Error(
          `Row ${i + 2}: readings must cover aligned half-hour intervals.`,
        );
      if (b > now + 60000)
        throw Error(
          `Row ${i + 2}: future intervals are not observed consumption.`,
        );
      const kwh = Number(value);
      if (!value || !Number.isFinite(kwh) || kwh < 0 || kwh > 200)
        throw Error(
          `Row ${i + 2}: enter import consumption from 0 to 200 kWh.`,
        );
      return {
        from: new Date(a).toISOString(),
        to: new Date(b).toISOString(),
        kwh,
      };
    })
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from));
  for (let i = 1; i < out.length; i++)
    if (Date.parse(out[i].from) < Date.parse(out[i - 1].to))
      throw Error(
        "CSV has duplicate or overlapping intervals. Remove them and import again.",
      );
  return out;
}
export type UsageSummary = {
  kwh: number;
  energyPence: number | null;
  standingPence: number | null;
  covered: number;
  total: number;
  days: number;
  completeDays: number;
  baselineKw: number | null;
};
export function summarize(
  readings: Reading[],
  tariff: Tariff | null,
): UsageSummary {
  const byDay = new Map<string, Reading[]>();
  for (const r of readings) {
    const key = dayKey(r.from);
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }
  const completeDays = [...byDay].filter(([key, rs]) => {
    const [a, b] = dayBounds(key);
    return (
      rs.length === (b - a) / 1800000 &&
      Date.parse(rs[0].from) === a &&
      Date.parse(rs.at(-1)!.to) === b
    );
  }).length;
  const rates =
    tariff && readings.length
      ? tariffRates(
          tariff,
          Date.parse(readings[0].from),
          Date.parse(readings.at(-1)!.to),
        ).map((r) => ({ ...r, value: r.pence }))
      : [];
  const costs = readings.map((r) =>
    tariff
      ? weightedValue(Date.parse(r.from), Date.parse(r.to), r.kwh, rates)
      : null,
  );
  const overnight = readings
    .filter((r) => {
      const h = Number(
        hours.format(r.from ? new Date(r.from) : 0).split(":")[0],
      );
      return h >= 0 && h < 5;
    })
    .map((r) => r.kwh * 2)
    .sort((a, b) => a - b);
  return {
    kwh: readings.reduce((s, r) => s + r.kwh, 0),
    energyPence:
      costs.length && costs.every((c) => c !== null)
        ? costs.reduce<number>((s, c) => s + c!, 0)
        : null,
    standingPence: tariff ? tariff.standing * byDay.size : null,
    covered: costs.filter((v) => v !== null).length,
    total: readings.length,
    days: byDay.size,
    completeDays,
    baselineKw:
      overnight.length >= 6
        ? overnight[Math.floor(overnight.length / 2)]
        : null,
  };
}
export function dailyGroups(readings: Reading[]) {
  return [...new Set(readings.map((r) => dayKey(r.from)))].sort();
}
export function selectPeriod(
  readings: Reading[],
  ending: string,
  days: number,
) {
  const [endStart] = dayBounds(ending);
  const lowerDate = dayKey(endStart - (days - 1) * 86400000 + 3 * 3600000);
  const [start] = dayBounds(lowerDate),
    [, end] = dayBounds(ending);
  return readings.filter(
    (r) => Date.parse(r.from) >= start && Date.parse(r.to) <= end,
  );
}
