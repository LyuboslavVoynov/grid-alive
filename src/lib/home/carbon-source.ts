import type { AreaData } from "@/types/area";
import type { SeriesPoint } from "@/types/insights";
import type { CarbonRate } from "./energy";
export type PlanningForecast = {
  area: AreaData | null;
  national: SeriesPoint[];
  regionalLoading: boolean;
  regionalError: string;
  error: string;
};
/** A selected region never silently falls back to national or another region's carbon. */
export function planningCarbon(
  regionId: string,
  area: AreaData | null,
  national: SeriesPoint[],
  unavailable = false,
): { rates: CarbonRate[]; label: string } {
  if (regionId) {
    if (
      !area ||
      String(area.regionId) !== regionId ||
      area.stale ||
      unavailable
    )
      return { rates: [], label: "Selected regional forecast unavailable" };
    return {
      rates: area.intervals
        .filter((p) => p.intensity !== null)
        .map((p) => ({ from: p.from, to: p.to, intensity: p.intensity! })),
      label: area.name + " regional forecast",
    };
  }
  return {
    rates: national.map((p) => ({
      from: p.at,
      to: new Date(Date.parse(p.at) + 1800000).toISOString(),
      intensity: p.value,
    })),
    label: "Great Britain forecast",
  };
}
