import { gridRegions } from "@/lib/geo/regions";
import { z } from "zod";
import { validateTariff, type Tariff, type TaskWindow } from "./energy";
import { parseReadings, type Reading } from "./usage";
const ts = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const tariffSchema = z.object({
  regionId: z.string().optional(),
  productCode: z.string().max(80).optional(),
  tariffCode: z.string().max(100).optional(),
  supplier: z.string().max(80).optional(),
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
    assumptions: z.string().max(300).optional(),
    from: ts,
    to: ts,
    cost: z.number().finite().nullable(),
    carbon: z.number().finite().nonnegative().nullable(),
  })
  .nullable();
export const defaultTaskDraft = {
  task: "Laundry" as const,
  kwh: "1",
  hours: "1.5",
  deadline: "24" as const,
};
const taskDraftSchema = z.object({
  task: z.enum(["Laundry", "Dishwasher", "EV charging", "Custom task"]),
  kwh: z.string().max(24),
  hours: z.string().max(24),
  deadline: z.enum(["6", "12", "24", "48"]),
});
export type HomeState = {
  taskDraft: z.infer<typeof taskDraftSchema>;
  regionId: string;
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
      taskDraft: taskDraftSchema.default(defaultTaskDraft),
      regionId: z
        .string()
        .refine((v) => v === "" || gridRegions.some((r) => String(r.id) === v))
        .default(""),
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
    regionId: raw.regionId,
    taskDraft: raw.taskDraft,
    tariff,
    readings,
    pricePlan: raw.pricePlan,
    carbonPlan: raw.carbonPlan,
  };
}
