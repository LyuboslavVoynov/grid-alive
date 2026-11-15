import { z } from "zod";
import { fetchJson, observationCache } from "./cache";
export const supplierNames: Record<string, string> = {
  OCTOPUS_ENERGY: "Octopus Energy",
  COOP_ENERGY: "Co-op Energy",
  LONDON_POWER: "London Power",
};
const timestamp = z.string().refine((v) => Number.isFinite(Date.parse(v)));
const productSchema = z.object({
  code: z.string(),
  display_name: z.string(),
  brand: z.string(),
  direction: z.string(),
  is_variable: z.boolean(),
  is_tracker: z.boolean(),
  is_restricted: z.boolean(),
  is_prepay: z.boolean(),
  is_business: z.boolean(),
  available_from: timestamp,
  available_to: timestamp.nullable(),
});
export type PublicProduct = {
  code: string;
  name: string;
  supplier: string;
  supplierName: string;
  family: "Agile" | "Flexible" | "Fixed";
};
/** Explicit plain-rate families; personalised charging and exports are excluded. */
export function publicProduct(
  input: unknown,
  now = Date.now(),
): PublicProduct | null {
  const p = productSchema.parse(input);
  if (
    p.direction !== "IMPORT" ||
    p.is_tracker ||
    p.is_restricted ||
    p.is_prepay ||
    p.is_business ||
    Date.parse(p.available_from) > now ||
    (p.available_to && Date.parse(p.available_to) <= now)
  )
    return null;
  let family: PublicProduct["family"] | null = null;
  if (p.brand === "OCTOPUS_ENERGY") {
    if (/^AGILE-\d{2}-\d{2}-\d{2}$/.test(p.code)) family = "Agile";
    else if (/^VAR-\d{2}-\d{2}-\d{2}$/.test(p.code)) family = "Flexible";
    else if (/^OE-FIX-\d+M-\d{2}-\d{2}-\d{2}$/.test(p.code) && !p.is_variable)
      family = "Fixed";
  }
  if (p.brand === "COOP_ENERGY") {
    if (/^COOP-VAR-\d{2}-\d{2}-\d{2}$/.test(p.code)) family = "Flexible";
    else if (/^COOP-FIX-\d+M-\d{2}-\d{2}-\d{2}$/.test(p.code) && !p.is_variable)
      family = "Fixed";
  }
  if (p.brand === "LONDON_POWER" && /^LP-VAR-\d{2}-\d{2}-\d{2}$/.test(p.code))
    family = "Flexible";
  return family
    ? {
        code: p.code,
        name: p.display_name,
        supplier: p.brand,
        supplierName: supplierNames[p.brand],
        family,
      }
    : null;
}
export async function productCatalogue() {
  return observationCache.read(
    "public-tariff-catalogue-v2",
    async () => {
      const products: PublicProduct[] = [];
      for (let page = 1; page <= 4; page++) {
        const raw = z
          .object({
            next: z.string().nullable(),
            results: z.array(z.unknown()),
          })
          .parse(
            await fetchJson(
              `https://api.octopus.energy/v1/products/?is_business=false&is_prepay=false&page_size=100&page=${page}`,
            ),
          );
        for (const entry of raw.results) {
          const p = publicProduct(entry);
          if (p) products.push(p);
        }
        if (!raw.next) return products;
        if (page === 4) throw Error("Catalogue exceeds supported page limit");
      }
      return products;
    },
    3600000,
  );
}
const rateSchema = z.object({
  next: z.string().nullable(),
  results: z.array(
    z.object({
      value_inc_vat: z.number().finite(),
      valid_from: timestamp,
      valid_to: timestamp.nullable(),
      payment_method: z.string().nullable().optional(),
    }),
  ),
});
/** Prefer explicit Direct Debit rows; do not mix overlapping generic and DD rates. */
export function directDebitRates(input: unknown, until: string) {
  const raw = rateSchema.parse(input);
  if (raw.next) throw Error("Rate window exceeds supported size");
  const applicable = raw.results.filter(
    (r) => r.payment_method === "DIRECT_DEBIT" || !r.payment_method,
  );
  const explicit = applicable.filter(
    (r) => r.payment_method === "DIRECT_DEBIT",
  );
  const selected = applicable.filter(
    (r) =>
      r.payment_method === "DIRECT_DEBIT" ||
      !explicit.some(
        (e) =>
          Date.parse(e.valid_from) < Date.parse(r.valid_to ?? until) &&
          Date.parse(e.valid_to ?? until) > Date.parse(r.valid_from),
      ),
  );
  const unique = new Map<string, { from: string; to: string; pence: number }>();
  for (const r of selected) {
    const point = {
      from: r.valid_from,
      to: r.valid_to ?? until,
      pence: r.value_inc_vat,
    };
    if (Date.parse(point.to) <= Date.parse(point.from))
      throw Error("Invalid rate interval");
    const key = Date.parse(point.from) + ":" + Date.parse(point.to);
    const prior = unique.get(key);
    if (prior && prior.pence !== point.pence)
      throw Error("Conflicting rate intervals");
    unique.set(key, point);
  }
  const rates = [...unique.values()].sort(
    (a, b) => Date.parse(a.from) - Date.parse(b.from),
  );
  for (let i = 1; i < rates.length; i++)
    if (Date.parse(rates[i].from) < Date.parse(rates[i - 1].to))
      throw Error("Overlapping price intervals");
  return rates;
}
export function publicTariffCodes(input: unknown) {
  const raw = z
    .object({
      single_register_electricity_tariffs: z.record(
        z.string(),
        z.object({
          direct_debit_monthly: z.object({ code: z.string() }).optional(),
          varying: z.object({ code: z.string() }).optional(),
        }),
      ),
    })
    .parse(input);
  return [
    ...new Set(
      Object.values(raw.single_register_electricity_tariffs).flatMap((r) =>
        r.direct_debit_monthly
          ? [r.direct_debit_monthly.code]
          : r.varying
            ? [r.varying.code]
            : [],
      ),
    ),
  ];
}
