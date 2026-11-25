import { cities, type Point } from "./scene";

export type SourceFuel =
  | "wind"
  | "solar"
  | "hydro"
  | "biomass"
  | "gas"
  | "nuclear"
  | "oil"
  | "coal"
  | "other";
/** Keep the fitted geography clear of controls and selection details. */
export function mapPadding(
  width: number,
  height: number,
  view: "flow" | "connections" | "carbon" = "flow",
) {
  const p = {
    top: width < 500 ? (view === "carbon" ? 75 : 145) : 35,
    bottom:
      width < 500
        ? view === "connections"
          ? 180
          : view === "carbon"
            ? 70
            : 145
        : 40,
    left: 30,
    right: 54,
  };
  const x = Math.min(1, (Math.max(0, width) * 0.6) / (p.left + p.right)),
    y = Math.min(1, (Math.max(0, height) * 0.6) / (p.top + p.bottom));
  return {
    top: p.top * y,
    bottom: p.bottom * y,
    left: p.left * x,
    right: p.right * x,
  };
}
export const sourceFuels: { key: SourceFuel; label: string; color: string }[] =
  [
    { key: "wind", label: "Wind", color: "#9ae4dd" },
    { key: "solar", label: "Solar", color: "#e6c68c" },
    { key: "hydro", label: "Hydro", color: "#8fc9e0" },
    { key: "biomass", label: "Biomass", color: "#a6c295" },
    { key: "gas", label: "Gas", color: "#a6bac6" },
    { key: "nuclear", label: "Nuclear", color: "#d3d0ae" },
    { key: "oil", label: "Oil", color: "#b9a090" },
    { key: "coal", label: "Coal", color: "#879299" },
    { key: "other", label: "Other", color: "#718b9a" },
  ];
/** Artwork points are generated once in longitude/latitude, never screen pixels. */
export function settlementLights() {
  let seed = 7143;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return cities.flatMap(([lon, lat, power]) =>
    Array.from({ length: Math.round(160 * power) }, () => {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 1.8) * 0.27 * Math.sqrt(power);
      return {
        point: [
          lon + Math.cos(angle) * radius * 1.5,
          lat + Math.sin(angle) * radius,
        ] as Point,
        brightness: 0.25 + random() * 0.7,
        radius: 0.3 + random() * 0.5,
      };
    }),
  );
}
