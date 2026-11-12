import { csvRows, parseReadings } from "./usage";
export type ColumnMapping = {
  from: number;
  to: number;
  energy: number;
  unit: "kwh" | "wh";
};
export function inspectConsumptionCsv(text: string) {
  if (text.length > 2_000_000) throw Error("Use a CSV smaller than 2 MB.");
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw Error("Add half-hour readings below the header.");
  if (rows.length > 35041)
    throw Error("Import at most 35,040 half-hour readings.");
  const headers = rows[0];
  if (headers.length < 3 || headers.length > 100)
    throw Error(
      "Choose a CSV with 3–100 columns, including interval start, interval end and energy.",
    );
  return { headers, sample: rows.slice(1, 4), count: rows.length - 1 };
}
export function detectConsumptionColumns(
  headers: string[],
): ColumnMapping | null {
  const normalized = headers.map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""),
  );
  const find = (names: string[]) => {
    const matches = normalized.flatMap((v, i) =>
      names.includes(v) ? [i] : [],
    );
    return matches.length === 1 ? matches[0] : -1;
  };
  const from = find(["intervalstart", "start", "from"]),
    to = find(["intervalend", "end", "to"]),
    energy = find([
      "consumption",
      "consumptionkwh",
      "kwh",
      "consumptionwh",
      "wh",
    ]);
  if ([from, to, energy].some((i) => i < 0)) return null;
  return {
    from,
    to,
    energy,
    unit: ["consumptionwh", "wh"].includes(normalized[energy]) ? "wh" : "kwh",
  };
}
export function parseMappedReadings(
  text: string,
  mapping: ColumnMapping,
  now = Date.now(),
) {
  const { headers } = inspectConsumptionCsv(text);
  if (
    !["kwh", "wh"].includes(mapping.unit) ||
    [mapping.from, mapping.to, mapping.energy].some(
      (i) => !Number.isInteger(i) || i < 0 || i >= headers.length,
    ) ||
    new Set([mapping.from, mapping.to, mapping.energy]).size !== 3
  )
    throw Error("Choose three different columns and the correct energy unit.");
  const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const rows = csvRows(text.replace(/^\uFEFF/, "")).slice(1);
  const canonical =
    "interval_start,interval_end,consumption\n" +
    rows
      .map((r) => {
        const value = r[mapping.energy]?.trim() ?? "";
        const energy =
          mapping.unit === "wh" && value !== ""
            ? String(Number(value) / 1000)
            : value;
        return [r[mapping.from] ?? "", r[mapping.to] ?? "", energy]
          .map(quote)
          .join(",");
      })
      .join("\n");
  return parseReadings(canonical, now);
}
