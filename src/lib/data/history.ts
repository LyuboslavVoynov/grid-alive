import type { History, Snapshot } from "@/types/electricity";
import {
  normalizeGeneration,
  normalizeDemand,
  normalizeCarbon,
  normalizeRegional,
} from "./normalize";
import { fetchJson, observationCache } from "./cache";
const minute = 60000;
/** Fixed, bounded public window: callers cannot turn this into an arbitrary proxy. */
export async function getHistory(now = Date.now()): Promise<History> {
  const end = Math.floor(now / (30 * minute)) * 30 * minute - 30 * minute,
    start = end - 47 * 30 * minute;
  const from = new Date(start).toISOString(),
    to = new Date(end + 30 * minute).toISOString(),
    publishedTo = new Date(end + 60 * minute).toISOString();
  const elexon = "https://data.elexon.co.uk/bmrs/api/v1/datasets/";
  const query = `?publishDateTimeFrom=${encodeURIComponent(from)}&publishDateTimeTo=${encodeURIComponent(publishedTo)}`;
  const results = await Promise.allSettled([
    observationCache.read(
      "history-fuel-" + from,
      () => fetchJson(elexon + "FUELINST" + query),
      600000,
    ),
    observationCache.read(
      "history-demand-" + from,
      () => fetchJson(elexon + "INDO" + query),
      600000,
    ),
    observationCache.read(
      "history-carbon-" + from,
      () =>
        fetchJson(`https://api.carbonintensity.org.uk/intensity/${from}/${to}`),
      600000,
    ),
    observationCache.read(
      "history-regional-" + from,
      () =>
        fetchJson(
          `https://api.carbonintensity.org.uk/regional/intensity/${from}/${to}`,
        ),
      600000,
    ),
  ]);
  const snapshots: Snapshot[] = [];
  for (let at = start; at <= end; at += 30 * minute) {
    const s: Snapshot = {
      generation: null,
      demand: null,
      carbon: null,
      regional: null,
      mode: "historical",
      requestedAt: new Date(at).toISOString(),
      errors: [],
    };
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status !== "fulfilled") {
        s.errors.push(
          ["Generation", "Demand", "Carbon", "Regional carbon"][i] +
            " history unavailable",
        );
        continue;
      }
      const { value, retrievedAt, stale } = result.value;
      try {
        if (i === 0) {
          s.generation = normalizeGeneration(value, retrievedAt, at, at);
          s.generation.stale ||= stale;
        }
        if (i === 1) {
          s.demand = normalizeDemand(value, retrievedAt, at, at);
          s.demand.stale ||= stale;
        }
        if (i === 2) {
          s.carbon = normalizeCarbon(value, retrievedAt, at, at);
          s.carbon.stale ||= stale;
        }
        if (i === 3) {
          s.regional = normalizeRegional(value, retrievedAt, at, at);
          s.regional.stale ||= stale;
        }
      } catch {
        s.errors.push(
          ["Generation", "Demand", "Carbon", "Regional carbon"][i] +
            " unavailable for selected period",
        );
      }
    }
    snapshots.push(s);
  }
  return { from, to, stepMinutes: 30, snapshots };
}
