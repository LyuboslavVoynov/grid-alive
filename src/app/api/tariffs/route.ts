import { z } from "zod";
import { fetchJson, observationCache } from "@/lib/data/cache";
import type { Tariff } from "@/lib/home/energy";
export const dynamic = "force-dynamic";
const base = "https://api.octopus.energy/v1/products/";
const ts = z.string().refine((v) => Number.isFinite(Date.parse(v)));
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    product = q.get("product"),
    tariff = q.get("tariff");
  try {
    if (!product) {
      const c = await observationCache.read(
        "supplier-products",
        () => fetchJson(base + "?is_business=false"),
        3600000,
      );
      const raw = z
        .object({
          results: z.array(
            z.object({
              code: z.string(),
              display_name: z.string(),
              direction: z.string().optional(),
              available_to: z.string().nullable().optional(),
            }),
          ),
        })
        .parse(c.value);
      return Response.json({
        products: raw.results
          .filter(
            (p) =>
              p.code.startsWith("AGILE-") &&
              p.direction !== "EXPORT" &&
              (!p.available_to || Date.parse(p.available_to) > Date.now()),
          )
          .map((p) => ({ code: p.code, name: p.display_name })),
        stale: c.stale,
      });
    }
    if (!/^AGILE-[A-Z0-9-]{1,50}$/.test(product))
      return Response.json(
        { error: "Choose a supported Agile import product." },
        { status: 400 },
      );
    const detail = await observationCache.read(
      "supplier-product-" + product,
      () => fetchJson(base + product + "/"),
      3600000,
    );
    const p = z
      .object({
        display_name: z.string(),
        single_register_electricity_tariffs: z.record(
          z.string(),
          z.object({
            direct_debit_monthly: z.object({ code: z.string() }).optional(),
          }),
        ),
      })
      .parse(detail.value);
    const codes = Object.values(p.single_register_electricity_tariffs).flatMap(
      (r) => (r.direct_debit_monthly ? [r.direct_debit_monthly.code] : []),
    );
    if (!tariff) return Response.json({ name: p.display_name, tariffs: codes });
    if (!codes.includes(tariff))
      return Response.json(
        { error: "Tariff code does not belong to this product." },
        { status: 400 },
      );
    const now = Date.now(),
      from = new Date(now - 14 * 86400000).toISOString(),
      to = new Date(now + 48 * 3600000).toISOString();
    const url = base + product + "/electricity-tariffs/" + tariff;
    const [rates, standing] = await Promise.all([
      observationCache.read(
        "supplier-rates-" + tariff,
        () =>
          fetchJson(
            url +
              `/standard-unit-rates/?page_size=1500&period_from=${from}&period_to=${to}`,
          ),
        300000,
      ),
      observationCache.read(
        "supplier-standing-" + tariff,
        () =>
          fetchJson(
            url +
              `/standing-charges/?page_size=100&period_from=${new Date(now).toISOString()}&period_to=${to}`,
          ),
        3600000,
      ),
    ]);
    const schema = z.object({
      next: z.string().nullable(),
      results: z.array(
        z.object({
          value_inc_vat: z.number().finite(),
          valid_from: ts,
          valid_to: ts.nullable(),
          payment_method: z.string().nullable().optional(),
        }),
      ),
    });
    const r = schema.parse(rates.value),
      s = schema.parse(standing.value);
    if (r.next) throw Error("Rate window exceeds supported size");
    const standard = r.results.filter(
      (v) => !v.payment_method || v.payment_method === "DIRECT_DEBIT",
    );
    const charge = s.results.find(
      (v) =>
        Date.parse(v.valid_from) <= now &&
        (!v.valid_to || Date.parse(v.valid_to) > now) &&
        (!v.payment_method || v.payment_method === "DIRECT_DEBIT"),
    );
    if (!standard.length || !charge) throw Error("No current charges");
    const out: Tariff = {
      name: `${p.display_name} · ${tariff}`,
      kind: "published",
      unit: 0,
      offPeak: 0,
      offStart: "00:00",
      offEnd: "00:30",
      standing: charge.value_inc_vat,
      rates: standard
        .map((v) => ({
          from: v.valid_from,
          to: v.valid_to ?? to,
          pence: v.value_inc_vat,
        }))
        .sort((a, b) => Date.parse(a.from) - Date.parse(b.from)),
      source: "Octopus public API · VAT-inclusive rates · direct debit",
      retrievedAt: rates.retrievedAt,
    };
    return Response.json({
      tariff: out,
      stale: rates.stale || standing.stale || detail.stale,
      standingValidTo: charge.valid_to,
    });
  } catch {
    return Response.json(
      {
        error:
          "Supplier tariff data is unavailable. You can enter rates manually.",
      },
      { status: 503 },
    );
  }
}
