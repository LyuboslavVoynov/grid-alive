import type { Snapshot, Generation, Demand, Carbon } from "@/types/electricity";
import {
  normalizeGeneration,
  normalizeDemand,
  normalizeCarbon,
} from "./normalize";
import { fetchJson, observationCache } from "./cache";
const ELEXON = "https://data.elexon.co.uk/bmrs/api/v1";
export async function getLatest(): Promise<Snapshot> {
  const now = Date.now(),
    retrieved = new Date().toISOString();
  const results = await Promise.allSettled([
    observationCache.read(
      "generation",
      async () => {
        const raw = await fetchJson(ELEXON + "/datasets/FUELINST");
        normalizeGeneration(raw, retrieved);
        return raw;
      },
      60000,
    ),
    observationCache.read(
      "demand",
      async () => {
        const raw = await fetchJson(ELEXON + "/datasets/INDO");
        normalizeDemand(raw, retrieved);
        return raw;
      },
      300000,
    ),
    observationCache.read(
      "carbon",
      async () => {
        const raw = await fetchJson(
          "https://api.carbonintensity.org.uk/intensity",
        );
        normalizeCarbon(raw, retrieved);
        return raw;
      },
      300000,
    ),
  ]);
  const snapshot: Snapshot = {
    generation: null,
    demand: null,
    carbon: null,
    errors: [],
    mode: "latest",
    requestedAt: new Date(now).toISOString(),
  };
  const parsers = [
    normalizeGeneration,
    normalizeDemand,
    normalizeCarbon,
  ] as const;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      try {
        const parsed = parsers[i](
          result.value.value,
          result.value.retrievedAt,
          undefined,
          now,
        );
        parsed.stale ||= result.value.stale;
        if (i === 0) snapshot.generation = parsed as Generation;
        if (i === 1) snapshot.demand = parsed as Demand;
        if (i === 2) snapshot.carbon = parsed as Carbon;
      } catch {
        snapshot.errors.push(
          ["Generation", "Demand", "Carbon intensity"][i] + " unavailable",
        );
      }
    } else
      snapshot.errors.push(
        ["Generation", "Demand", "Carbon intensity"][i] +
          " provider unavailable",
      );
  }
  return snapshot;
}
