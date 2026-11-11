export type Rate = { from: string; to: string; pence: number };
export type Tariff = {
  name: string;
  kind: "single" | "tou" | "published";
  unit: number;
  offPeak: number;
  offStart: string;
  offEnd: string;
  standing: number;
  rates: Rate[];
  source: string;
  retrievedAt?: string;
};
export type CarbonRate = { from: string; to: string; intensity: number };
export type TaskWindow = {
  from: string;
  to: string;
  cost: number | null;
  carbon: number | null;
};
const halfHour = 1800000;
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(pence / 100);
export function timeMinutes(s: string) {
  if (!/^\d{2}:(00|30)$/.test(s))
    throw Error("Use half-hour tariff boundaries.");
  const [h, m] = s.split(":").map(Number);
  if (h > 23) throw Error("Invalid time");
  return h * 60 + m;
}
export function validateTariff(t: Tariff) {
  if (!t.name.trim()) throw Error("Give your tariff a name.");
  if (!Number.isFinite(t.standing) || t.standing < 0 || t.standing > 1000)
    throw Error("Enter a valid standing charge in p/day.");
  if (
    t.kind !== "published" &&
    (!Number.isFinite(t.unit) || t.unit < -100 || t.unit > 1000)
  )
    throw Error("Enter a valid unit rate in p/kWh.");
  if (t.kind === "tou") {
    if (!Number.isFinite(t.offPeak) || t.offPeak < -100 || t.offPeak > 1000)
      throw Error("Enter a valid off-peak rate.");
    if (timeMinutes(t.offStart) === timeMinutes(t.offEnd))
      throw Error("Off-peak start and end must differ.");
  }
  if (t.kind === "published" && !t.rates.length)
    throw Error("No published rates in this window.");
  return t;
}
export function manualRateAt(t: Tariff, at: number) {
  if (t.kind === "single") return t.unit;
  const parts = clock.formatToParts(at),
    h = Number(parts.find((p) => p.type === "hour")?.value),
    m = Number(parts.find((p) => p.type === "minute")?.value),
    v = h * 60 + m;
  const start = timeMinutes(t.offStart),
    end = timeMinutes(t.offEnd);
  const off = start < end ? v >= start && v < end : v >= start || v < end;
  return off ? t.offPeak : t.unit;
}
export function tariffRates(t: Tariff, from: number, to: number): Rate[] {
  if (t.kind === "published") return t.rates;
  const rates: Rate[] = [];
  for (let at = Math.floor(from / halfHour) * halfHour; at < to; at += halfHour)
    rates.push({
      from: new Date(at).toISOString(),
      to: new Date(at + halfHour).toISOString(),
      pence: manualRateAt(t, at),
    });
  return rates;
}
/** Integrate a constant-load task across complete price/carbon intervals. A gap is unknown, not zero. */
export function weightedValue(
  from: number,
  to: number,
  kwh: number,
  intervals: { from: string; to: string; value: number }[],
): number | null {
  if (!(to > from) || !Number.isFinite(kwh) || kwh < 0) return null;
  const sorted = intervals
    .map((r) => ({
      start: Date.parse(r.from),
      end: Date.parse(r.to),
      value: r.value,
    }))
    .filter((r) => Number.isFinite(r.value) && r.end > from && r.start < to)
    .sort((a, b) => a.start - b.start);
  let cursor = from,
    total = 0;
  for (const r of sorted) {
    if (r.start > cursor) return null;
    const end = Math.min(to, r.end);
    if (end > cursor) {
      total += ((end - cursor) / (to - from)) * kwh * r.value;
      cursor = end;
    }
    if (cursor >= to) return total;
  }
  return null;
}
export function taskWindows(
  tariff: Tariff,
  kwh: number,
  durationHours: number,
  carbon: CarbonRate[],
  now = Date.now(),
  deadline = now + 48 * 3600000,
): TaskWindow[] {
  if (
    !Number.isFinite(kwh) ||
    kwh <= 0 ||
    kwh > 200 ||
    !Number.isFinite(durationHours) ||
    durationHours < 0.5 ||
    durationHours > 24 ||
    (durationHours * 2) % 1
  )
    return [];
  const start = Math.ceil(now / halfHour) * halfHour,
    end = Math.min(deadline, now + 48 * 3600000),
    duration = durationHours * 3600000,
    rates = tariffRates(tariff, start, end).map((r) => ({
      ...r,
      value: r.pence,
    }));
  const cs = carbon.map((r) => ({ ...r, value: r.intensity }));
  const out: TaskWindow[] = [];
  for (let at = start; at + duration <= end; at += halfHour)
    out.push({
      from: new Date(at).toISOString(),
      to: new Date(at + duration).toISOString(),
      cost: weightedValue(at, at + duration, kwh, rates),
      carbon: weightedValue(at, at + duration, kwh, cs),
    });
  return out;
}
export function cheapest(windows: TaskWindow[]) {
  return (
    windows
      .filter((w) => w.cost !== null)
      .sort(
        (a, b) => a.cost! - b.cost! || Date.parse(a.from) - Date.parse(b.from),
      )[0] ?? null
  );
}
export function cleanest(windows: TaskWindow[]) {
  return (
    windows
      .filter((w) => w.carbon !== null)
      .sort(
        (a, b) =>
          a.carbon! - b.carbon! || Date.parse(a.from) - Date.parse(b.from),
      )[0] ?? null
  );
}
