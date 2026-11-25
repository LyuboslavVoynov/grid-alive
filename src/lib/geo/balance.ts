import type { AreaData, AreaInterval } from "@/types/area";
import type { Generation } from "@/types/electricity";
export const fuelColors: Record<string, string> = {
  wind: "#9ae4dd",
  solar: "#e6c68c",
  nuclear: "#d3d0ae",
  gas: "#a6bac6",
  hydro: "#8fc9e0",
  biomass: "#a6c295",
  imports: "#9fa3c5",
  coal: "#879299",
  oil: "#b9a090",
  other: "#718b9a",
};
export const fuelLabel = (key: string) =>
  key === "imports" ? "Imports" : key.charAt(0).toUpperCase() + key.slice(1);
/** Never reuse another region or a future/expired interval as the current regional mix. */
export function areaInterval(
  area: AreaData | null,
  regionId: string,
  at: string | number,
): AreaInterval | null {
  if (!area || String(area.regionId) !== regionId) return null;
  const now = typeof at === "number" ? at : Date.parse(at);
  return (
    area.intervals.find(
      (p) => Date.parse(p.from) <= now && Date.parse(p.to) > now,
    ) ?? null
  );
}
export type MixRow = {
  fuel: string;
  label: string;
  perc: number;
  mw?: number;
  color: string;
};
export function balanceMix(
  regionId: string,
  interval: AreaInterval | null,
  generation: Generation | null,
): MixRow[] {
  if (regionId)
    return (interval?.mix ?? [])
      .map((f) => ({
        ...f,
        label: fuelLabel(f.fuel),
        color: fuelColors[f.fuel] ?? fuelColors.other,
      }))
      .sort((a, b) => b.perc - a.perc);
  return (generation?.fuels ?? [])
    .filter((f) => f.share > 0)
    .map((f) => ({
      fuel: f.key,
      label: f.label,
      perc: f.share,
      mw: f.mw,
      color: fuelColors[f.key] ?? fuelColors.other,
    }))
    .sort((a, b) => b.perc - a.perc);
}
