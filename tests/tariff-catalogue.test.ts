import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../src/lib/data/cache", () => ({
  fetchJson: mocks.fetch,
  observationCache: {
    read: async (_key: string, load: () => Promise<unknown>) => ({
      value: await load(),
      retrievedAt: "2026-11-12T11:00Z",
      stale: false,
    }),
  },
}));
import {
  publicProduct,
  directDebitRates,
  publicTariffCodes,
  productCatalogue,
} from "../src/lib/data/tariffs";
import { GET } from "../src/app/api/tariffs/route";
const product = (code = "VAR-22-11-01", brand = "OCTOPUS_ENERGY") => ({
  code,
  brand,
  display_name: "Flexible",
  direction: "IMPORT",
  is_variable: true,
  is_tracker: false,
  is_restricted: false,
  is_prepay: false,
  is_business: false,
  available_from: "2020-01-01T00:00Z",
  available_to: null,
});
const row = (
  value: number,
  payment: string | null,
  from = "2020-01-01T00:00Z",
  to: string | null = null,
) => ({
  value_inc_vat: value,
  valid_from: from,
  valid_to: to,
  payment_method: payment,
});
beforeEach(() => {
  mocks.fetch.mockReset();
});
it("supports explicit plain-rate families across three published brands", () => {
  expect(publicProduct(product())?.family).toBe("Flexible");
  expect(
    publicProduct({ ...product("OE-FIX-12M-26-11-09"), is_variable: false })
      ?.family,
  ).toBe("Fixed");
  expect(
    publicProduct(product("COOP-VAR-23-04-01", "COOP_ENERGY"))?.supplierName,
  ).toBe("Co-op Energy");
  expect(
    publicProduct(product("LP-VAR-23-04-01", "LONDON_POWER"))?.supplierName,
  ).toBe("London Power");
});
it("excludes exports, personal smart schedules, restricted plans and expired offers", () => {
  for (const p of [
    { ...product(), direction: "EXPORT" },
    { ...product(), is_tracker: true },
    { ...product(), is_restricted: true },
    { ...product(), is_prepay: true },
    { ...product(), available_to: "2020-01-02T00:00Z" },
    product("IOG-SMB-VAR-26-10-29"),
    product("ZERO-IMPORT-60M-25-01-01"),
  ])
    expect(publicProduct(p)).toBeNull();
});
it("uses explicit direct-debit prices instead of overlapping generic or non-DD prices", () => {
  const rates = directDebitRates(
    {
      next: null,
      results: [
        row(25, null),
        row(20, "DIRECT_DEBIT"),
        row(30, "NON_DIRECT_DEBIT"),
      ],
    },
    "2026-11-14T00:00Z",
  );
  expect(rates).toEqual([
    { from: "2020-01-01T00:00Z", to: "2026-11-14T00:00Z", pence: 20 },
  ]);
  expect(
    directDebitRates(
      { next: null, results: [row(-5, null)] },
      "2026-11-14T00:00Z",
    )[0].pence,
  ).toBe(-5);
});
it("rejects conflicting, overlapping or truncated rate responses", () => {
  expect(() =>
    directDebitRates(
      { next: null, results: [row(20, null), row(25, null)] },
      "2026-11-14T00:00Z",
    ),
  ).toThrow(/Conflicting/);
  expect(() =>
    directDebitRates({ next: "more", results: [] }, "2026-11-14T00:00Z"),
  ).toThrow(/size/);
});
it("recognises both direct-debit and varying product detail structures", () => {
  expect(
    publicTariffCodes({
      single_register_electricity_tariffs: {
        _C: { varying: { code: "E-1R-VAR-22-11-01-C" } },
        _A: { direct_debit_monthly: { code: "E-1R-VAR-22-11-01-A" } },
      },
    }),
  ).toHaveLength(2);
});
it("constructs bounded catalogue pages instead of following arbitrary next URLs", async () => {
  mocks.fetch
    .mockResolvedValueOnce({
      next: "https://untrusted.example/",
      results: [product()],
    })
    .mockResolvedValueOnce({ next: null, results: [] });
  expect((await productCatalogue()).value).toHaveLength(1);
  expect(mocks.fetch.mock.calls[1][0]).toContain(
    "api.octopus.energy/v1/products/?",
  );
  expect(mocks.fetch.mock.calls[1][0]).toContain("page=2");
});
it("rejects malformed products without any upstream request", async () => {
  const r = await GET(
    new Request("https://local/api/tariffs?product=..%2Fprivate"),
  );
  expect(r.status).toBe(400);
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it("imports Flexible prices from the correct payment method and region", async () => {
  mocks.fetch.mockImplementation(async (url: string) => {
    if (url.includes("/products/?"))
      return { next: null, results: [product()] };
    if (url.includes("standard-unit-rates"))
      return {
        next: null,
        results: [
          row(26.5956, "DIRECT_DEBIT"),
          row(28.0896, "NON_DIRECT_DEBIT"),
        ],
      };
    if (url.includes("standing-charges"))
      return {
        next: null,
        results: [row(41.3869, "DIRECT_DEBIT"), row(50, "NON_DIRECT_DEBIT")],
      };
    const { direction: _direction, ...detail } = product();
    return {
      ...detail,
      single_register_electricity_tariffs: {
        _C: { varying: { code: "E-1R-VAR-22-11-01-C" } },
      },
    };
  });
  const r = await GET(
    new Request(
      "https://local/api/tariffs?product=VAR-22-11-01&tariff=E-1R-VAR-22-11-01-C",
    ),
  );
  expect(r.status).toBe(200);
  const data = await r.json();
  expect(data.tariff.regionId).toBe("13");
  expect(data.tariff.rates[0].pence).toBe(26.5956);
  expect(data.tariff.standing).toBe(41.3869);
});
