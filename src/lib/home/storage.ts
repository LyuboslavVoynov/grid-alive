import { z } from "zod";
import { validateTariff, type Tariff, type TaskWindow } from "./energy";
import { parseReadings, type Reading } from "./usage";
const ts = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const tariffSchema = z.object({
  name: z.string().max(150),
  kind: z.enum(["single", "tou", "published"]),
  unit: z.number().finite(),
  offPeak: z.number().finite(),
  offStart: z.string(),
  offEnd: z.string(),
  standing: z.number().finite(),
  rates: z
    .array(z.object({ from: ts, to: ts, pence: z.number().finite() }))
    .max(2000),
  source: z.string().max(200),
  retrievedAt: ts.optional(),
});
const windowSchema = z
  .object({
    from: ts,
    to: ts,
    cost: z.number().finite().nullable(),
    carbon: z.number().finite().nonnegative().nullable(),
  })
  .nullable();
export type HomeState = {
  tariff: Tariff | null;
  readings: Reading[];
  pricePlan: TaskWindow | null;
  carbonPlan: TaskWindow | null;
};
export const storageKey = "grid-alive-home-v2";
export function decodeHomeState(text: string): HomeState {
  if (text.length > 4_000_000) throw Error("Stored workspace too large");
  const raw = z
    .object({
      version: z.literal(1),
      tariff: tariffSchema.nullable(),
      readings: z
        .array(z.object({ from: ts, to: ts, kwh: z.number().finite() }))
        .max(35040),
      pricePlan: windowSchema,
      carbonPlan: windowSchema,
    })
    .parse(JSON.parse(text));
  const tariff = raw.tariff ? validateTariff(raw.tariff) : null;
  const readings = raw.readings.length
    ? parseReadings(
        "interval_start,interval_end,consumption\n" +
          raw.readings.map((r) => `${r.from},${r.to},${r.kwh}`).join("\n"),
      )
    : [];
  return {
    tariff,
    readings,
    pricePlan: raw.pricePlan,
    carbonPlan: raw.carbonPlan,
  };
}
