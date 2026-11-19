import records from "../../../data/renewable-assets.json";
import stations from "../../../data/power-stations.json";
import type { Point } from "./scene";
export type EnergyAsset = {
  id: string;
  name: string;
  technology: string;
  fuel: string;
  capacityMw: number;
  turbines: number | null;
  point: Point;
  country: string;
  updated: string;
  snapshot?: string;
  region?: string;
  source: string;
  status: string;
};
export const energyAssets = [...records, ...stations] as EnergyAsset[];
