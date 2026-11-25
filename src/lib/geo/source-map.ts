import { energyAssets, type EnergyAsset } from "./assets";
import type { Point } from "./scene";
import type { SourceFuel } from "./night-atlas";

export const sourceTitles: Record<SourceFuel, string> = {
  wind: "Wind farms",
  solar: "Solar farms",
  hydro: "Hydroelectric stations",
  biomass: "Biomass stations",
  gas: "Gas-fired power stations",
  nuclear: "Nuclear power stations",
  oil: "Oil-fired power stations",
  coal: "Coal-fired power stations",
  other: "Other generation",
};
export function sourceInventory(fuel: SourceFuel | null) {
  return energyAssets.filter((a) => fuel === null || a.fuel === fuel);
}
export function sourceCoverage(fuel: SourceFuel | null) {
  if (fuel === "gas" || fuel === "nuclear" || fuel === "oil")
    return "Major power producers · May 2026 register";
  if (fuel === "coal" || fuel === "other")
    return "No matched station locations in our inventory";
  return fuel
    ? "Featured renewable sites · July 2026 register"
    : "Featured renewables and major-producer stations";
}
export type SourceMarker = { id: string; assets: EnergyAsset[]; screen: Point };
/** One deterministic grouping is shared by canvas drawing and native button targets.
 * Nearby sites cluster; no site is discarded to keep the picture quiet. Never use capacity as output.
 */
export function sourceMarkers(
  fuel: SourceFuel | null,
  project: (p: Point) => Point,
  width: number,
  height: number,
): SourceMarker[] {
  const groups: SourceMarker[] = sourceInventory(fuel)
    .toSorted((a, b) => a.id.localeCompare(b.id))
    .flatMap((asset) => {
      const p = project(asset.point);
      return p.every(Number.isFinite) &&
        p[0] >= 22 &&
        p[1] >= 22 &&
        p[0] <= width - 22 &&
        p[1] <= height - 22
        ? [{ id: asset.id, assets: [asset], screen: p }]
        : [];
    });
  // Agglomerate in a stable order until every visible target is at least 48px apart.
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i],
          b = groups[j];
        if (
          Math.hypot(a.screen[0] - b.screen[0], a.screen[1] - b.screen[1]) >= 48
        )
          continue;
        const n = a.assets.length,
          m = b.assets.length;
        a.screen = [
          (a.screen[0] * n + b.screen[0] * m) / (n + m),
          (a.screen[1] * n + b.screen[1] * m) / (n + m),
        ];
        a.assets.push(...b.assets);
        a.id = a.assets
          .map((s) => s.id)
          .sort()
          .join("|");
        groups.splice(j, 1);
        changed = true;
        break outer;
      }
  }
  return groups;
}
