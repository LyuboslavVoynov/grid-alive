import { z } from "zod";
import { validRegionId } from "@/lib/geo/regions";
import regionBoundaries from "../../../public/geo/regions.json";
import { fetchJson, observationCache } from "./cache";
import type { AreaData } from "@/types/area";
export function outwardCode(input: string) {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  const match = s.match(/^([A-Z]{1,2}\d[A-Z\d]?)(?:\d[A-Z]{2})?$/);
  if (!match)
    throw Error("Enter a valid GB outward postcode, such as SW1A or EH1.");
  if (match[1].startsWith("BT"))
    throw Error("Northern Ireland is outside this Great Britain dataset.");
  return match[1];
}
const timestamp = z.string().refine((v) => Number.isFinite(Date.parse(v)));
export function parseArea(
  raw: unknown,
  postcode: string,
  retrievedAt: string,
): AreaData {
  const interval = z.object({
    from: timestamp,
    to: timestamp,
    intensity: z.object({
      forecast: z.number().finite().nonnegative().nullable(),
    }),
    generationmix: z.array(
      z.object({ fuel: z.string(), perc: z.number().finite().min(0).max(100) }),
    ),
  });
  const region = z.object({
    regionid: z.number().int().min(1).max(17),
    shortname: z.string(),
    dnoregion: z.string(),
    data: z.array(interval).min(1),
  });
  const parsed = z.object({ data: region }).parse(raw).data;
  return {
    postcode,
    name: parsed.shortname,
    regionId: parsed.regionid,
    dno: parsed.dnoregion,
    retrievedAt,
    stale: false,
    intervals: parsed.data.map((r) => ({
      from: r.from,
      to: r.to,
      intensity: r.intensity.forecast,
      mix: r.generationmix,
    })),
    point: null,
    authorities: [],
    warnings: [],
  };
}
export async function getArea(input: string): Promise<AreaData> {
  const postcode = outwardCode(input),
    at = new Date().toISOString();
  const cached = await observationCache.read(
    "area-" + postcode,
    async () => {
      const raw = await fetchJson(
        `https://api.carbonintensity.org.uk/regional/intensity/${at}/fw48h/postcode/${postcode}`,
      );
      parseArea(raw, postcode, at);
      return raw;
    },
    300000,
  );
  const data = parseArea(cached.value, postcode, cached.retrievedAt);
  data.stale = cached.stale;
  if (data.intervals.every((r) => Date.parse(r.to) < Date.now()))
    data.stale = true;
  try {
    const geo = await observationCache.read(
      "outcode-" + postcode,
      () => fetchJson(`https://api.postcodes.io/outcodes/${postcode}`),
      86400000,
    );
    const r = z
      .object({
        result: z.object({
          longitude: z.number().finite(),
          latitude: z.number().finite(),
          admin_district: z.array(z.string()),
        }),
      })
      .parse(geo.value).result;
    data.point = [r.longitude, r.latitude];
    data.authorities = r.admin_district;
  } catch {
    data.warnings.push(
      "Postcode geography is unavailable. You can choose a local authority below.",
    );
  }
  return data;
}

/** Region selection does not require a postcode or a geocoder request. */
export async function getRegionArea(input: string): Promise<AreaData> {
  const id = validRegionId(input),
    at = new Date().toISOString();
  const cached = await observationCache.read(
    "area-region-" + id,
    async () => {
      const raw = await fetchJson(
        `https://api.carbonintensity.org.uk/regional/intensity/${at}/fw48h/regionid/${id}`,
      );
      const parsed = parseArea(raw, "", at);
      if (parsed.regionId !== id) throw Error("Region response mismatch");
      return raw;
    },
    300000,
  );
  const data = parseArea(cached.value, "", cached.retrievedAt);
  data.stale =
    cached.stale || data.intervals.every((r) => Date.parse(r.to) < Date.now());
  const geometry = regionBoundaries.features.find(
    (f) => f.properties.regionId === id,
  )?.geometry;
  if (geometry) {
    const points = geometry.coordinates.flat(2);
    const lon = points.map((p) => p[0]),
      lat = points.map((p) => p[1]);
    data.point = [
      (Math.min(...lon) + Math.max(...lon)) / 2,
      (Math.min(...lat) + Math.max(...lat)) / 2,
    ];
  }
  return data;
}
