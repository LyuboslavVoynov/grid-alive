import { z } from "zod";
import { fetchJson, observationCache } from "@/lib/data/cache";
import {
  productCatalogue,
  publicProduct,
  publicTariffCodes,
  directDebitRates,
} from "@/lib/data/tariffs";
import { gridRegions } from "@/lib/geo/regions";
import type { Tariff } from "@/lib/home/energy";
export const dynamic = "force-dynamic";
const base = "https://api.octopus.energy/v1/products/";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    product = q.get("product"),
    tariff = q.get("tariff");
  if (product && !/^[A-Z0-9-]{1,80}$/.test(product))
    return Response.json(
      { error: "Choose a supported public import product." },
      { status: 400 },
    );
  try {
    const catalogue = await productCatalogue();
    if (!product)
      return Response.json({
        products: catalogue.value,
        stale: catalogue.stale,
      });
    const selected = catalogue.value.find((p) => p.code === product);
    if (!selected)
      return Response.json(
        {
          error:
            "This product is not supported in the current public catalogue.",
        },
        { status: 400 },
      );
    const detail = await observationCache.read(
      "public-product-" + product,
      () => fetchJson(base + product + "/"),
      3600000,
    );
    const detailRecord = z.record(z.string(), z.unknown()).parse(detail.value);
    // Product detail omits direction; the catalogue above already validated IMPORT.
    if (
      detailRecord.direction !== undefined &&
      detailRecord.direction !== "IMPORT"
    )
      throw Error("Product direction changed");
    const checked = publicProduct({
      ...detailRecord,
      direction: detailRecord.direction ?? "IMPORT",
    });
    if (
      !checked ||
      checked.code !== product ||
      checked.supplier !== selected.supplier
    )
      throw Error("Product metadata changed");
    const codes = publicTariffCodes(detail.value);
    if (!tariff)
      return Response.json({
        name: selected.name,
        tariffs: codes,
        stale: catalogue.stale || detail.stale,
      });
    if (!codes.includes(tariff))
      return Response.json(
        { error: "Tariff code does not belong to this product." },
        { status: 400 },
      );
    const now = Date.now(),
      from = new Date(now - 14 * 86400000).toISOString(),
      to = new Date(now + 48 * 3600000).toISOString(),
      url = base + product + "/electricity-tariffs/" + tariff;
    const [rates, standing] = await Promise.all([
      observationCache.read(
        "public-rates-" + tariff,
        () =>
          fetchJson(
            url +
              `/standard-unit-rates/?page_size=1500&period_from=${from}&period_to=${to}`,
          ),
        300000,
      ),
      observationCache.read(
        "public-standing-" + tariff,
        () =>
          fetchJson(
            url +
              `/standing-charges/?page_size=100&period_from=${new Date(now).toISOString()}&period_to=${to}`,
          ),
        3600000,
      ),
    ]);
    const parsed = directDebitRates(rates.value, to),
      charges = directDebitRates(standing.value, to),
      charge = charges.find(
        (r) => Date.parse(r.from) <= now && Date.parse(r.to) > now,
      );
    if (!parsed.length || !charge) throw Error("No current charges");
    const region = gridRegions.find((r) =>
      tariff.endsWith("-" + r.tariffLetter),
    );
    if (!region) throw Error("Unknown tariff region");
    const out: Tariff = {
      name: `${selected.name} · ${region.name}`,
      kind: "published",
      unit: 0,
      offPeak: 0,
      offStart: "00:00",
      offEnd: "00:30",
      standing: charge.pence,
      rates: parsed,
      source: `${selected.supplierName} · Octopus public API · VAT-inclusive · direct debit`,
      retrievedAt: rates.retrievedAt,
      regionId: String(region.id),
      productCode: product,
      tariffCode: tariff,
      supplier: selected.supplier,
    };
    return Response.json({
      tariff: out,
      stale: catalogue.stale || detail.stale || rates.stale || standing.stale,
      standingValidTo: charge.to,
    });
  } catch {
    return Response.json(
      {
        error:
          "Public tariff data is unavailable. Carbon planning still works, and exact bill-rate entry is optional.",
      },
      { status: 503 },
    );
  }
}
