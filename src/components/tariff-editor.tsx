"use client";
import { useEffect, useState } from "react";
import { type Tariff, validateTariff, money } from "@/lib/home/energy";
import { useEnergyWorkspace } from "./energy-workspace";
import { RegionSelect } from "./region-select";
import { tariffForRegion } from "@/lib/geo/regions";
import { localTime } from "./series-chart";
export function TariffEditor({
  tariff,
  onSave,
}: {
  tariff: Tariff | null;
  onSave: (t: Tariff) => void;
}) {
  const { state } = useEnergyWorkspace();
  const [kind, setKind] = useState<"single" | "tou">(
      tariff?.kind === "tou" ? "tou" : "single",
    ),
    [name, setName] = useState(
      tariff?.kind !== "published" ? (tariff?.name ?? "") : "",
    ),
    [unit, setUnit] = useState(
      tariff?.kind !== "published" && tariff ? String(tariff.unit) : "",
    ),
    [standing, setStanding] = useState(tariff ? String(tariff.standing) : ""),
    [offPeak, setOffPeak] = useState(
      tariff?.kind === "tou" ? String(tariff.offPeak) : "",
    ),
    [offStart, setStart] = useState(tariff?.offStart ?? "00:30"),
    [offEnd, setEnd] = useState(tariff?.offEnd ?? "07:30"),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [products, setProducts] = useState<
      {
        code: string;
        name: string;
        supplier: string;
        supplierName: string;
        family: string;
      }[]
    >([]),
    [supplier, setSupplier] = useState(tariff?.supplier ?? ""),
    [regionId, setRegionId] = useState(tariff?.regionId ?? state.regionId),
    [product, setProduct] = useState(tariff?.productCode ?? ""),
    [codes, setCodes] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/tariffs", { signal: c.signal })
      .then((r) => r.json())
      .then((v) => {
        if (c.signal.aborted) return;
        setProducts(v.products ?? []);
        if (v.error) setError(v.error);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            "The public catalogue is unavailable. You can still explore carbon timing.",
          );
      });
    return () => c.abort();
  }, []);
  async function loadProduct(v: string) {
    setProduct(v);
    setCodes([]);
    setError("");
    if (!v) return;
    setBusy(true);
    try {
      const r = await fetch("/api/tariffs?product=" + encodeURIComponent(v));
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setCodes(d.tariffs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Product unavailable");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (tariff?.productCode) void loadProduct(tariff.productCode);
  }, []);
  const suppliers = [
    ...new Map(products.map((p) => [p.supplier, p.supplierName])).entries(),
  ];
  const code = tariffForRegion(codes, regionId);
  async function importTariff() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/tariffs?product=${encodeURIComponent(product)}&tariff=${encodeURIComponent(code ?? "")}`,
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.stale)
        throw Error(
          "Supplier rates are delayed. Refresh before using them for a new plan.",
        );
      onSave(validateTariff(d.tariff));
      setMessage("Published rates loaded. Only covered periods can be costed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rates unavailable");
    } finally {
      setBusy(false);
    }
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (
        !unit.trim() ||
        !standing.trim() ||
        (kind === "tou" && !offPeak.trim())
      )
        throw Error(
          "Fill in all required rates, including a zero standing charge if applicable.",
        );
      onSave(
        validateTariff({
          name:
            name.trim() ||
            (kind === "single"
              ? "My single-rate tariff"
              : "My peak/off-peak tariff"),
          kind,
          unit: Number(unit),
          standing: Number(standing),
          offPeak: kind === "tou" ? Number(offPeak) : Number(unit),
          offStart,
          offEnd,
          rates: [],
          source: "Manually entered · assumed VAT-inclusive",
        }),
      );
      setMessage("Your tariff is ready. You can now compare task windows.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid tariff");
    }
  }
  return (
    <div className="tariff-editor selection-tariff">
      <section className="supplier-import selection-supplier wide">
        <p className="eyebrow">CHOOSE, THEN LOAD</p>
        <h2>Choose your supplier and tariff</h2>
        <p className="section-copy">
          Select your current supplier, tariff version and electricity region.
          Load supported public rates from your choices; no tariff codes or API
          keys to type.
        </p>
        <div className="field-grid">
          <label className="wide">
            Electricity supplier
            <select
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                setProduct("");
                setCodes([]);
                setError("");
                setMessage("");
              }}
              disabled={busy}
            >
              <option value="">Choose your supplier</option>
              {suppliers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              <option value="other">Another supplier</option>
              <option value="unknown">I'm not sure</option>
            </select>
          </label>
          {suppliers.some(([id]) => id === supplier) && (
            <>
              <label>
                Current tariff version
                <select
                  value={product}
                  onChange={(e) => void loadProduct(e.target.value)}
                  disabled={busy}
                >
                  <option value="">Choose your tariff</option>
                  {products
                    .filter((p) => p.supplier === supplier)
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ·{" "}
                        {p.code.match(/\d{2}-\d{2}-\d{2}$/)?.[0] ?? p.code}
                      </option>
                    ))}
                </select>
              </label>
              <RegionSelect
                id="tariff-region"
                value={regionId}
                onChange={setRegionId}
                disabled={busy}
              />
              <button
                className="action-button wide"
                onClick={() => void importTariff()}
                disabled={!code || busy}
              >
                {busy ? "Loading…" : "Load my tariff rates ↗"}
              </button>
              {!products.length && (
                <p className="small wide">
                  No supported public tariff is currently available. You can
                  explore carbon timing without a tariff or use the optional
                  bill-rate form below.
                </p>
              )}
              {product && regionId && !busy && !code && (
                <p className="small wide">
                  This product has no matching regional rate available. Choose
                  another supported version or continue with carbon timing only.
                </p>
              )}
            </>
          )}
        </div>
        {(supplier === "other" || supplier === "unknown") && (
          <p className="selection-notice">
            Public price import is available for selected Octopus Energy, Co-op
            Energy and London Power plans. You can explore the grid and carbon
            task windows without entering rates. Exact bill rates remain
            optional below.
          </p>
        )}
        <p className="small">
          Choose your existing tariff; this does not change your supplier or
          confirm eligibility. Only direct-debit, single-register import rates
          are supported. Other suppliers, smart charging rewards and
          personalised discounts can be entered manually where the schedule is
          known. Published future prices appear only when released.
        </p>
        {tariff && (
          <div className="active-tariff">
            <p className="eyebrow">ACTIVE TARIFF</p>
            <h3>{tariff.name}</h3>
            <p>
              {tariff.kind === "published"
                ? "Published interval rates"
                : tariff.kind === "single"
                  ? `${tariff.unit}p/kWh`
                  : `${tariff.unit}p peak · ${tariff.offPeak}p off-peak`}{" "}
              · {money(tariff.standing)}/day standing charge
            </p>
            <p className="small">
              {tariff.source}
              {tariff.retrievedAt
                ? ` · retrieved ${localTime(tariff.retrievedAt)}`
                : ""}
            </p>
          </div>
        )}
      </section>
      <details className="manual-tariff wide">
        <summary>Optional: enter exact rates from your bill</summary>
        <section>
          <p className="eyebrow">YOUR HOUSEHOLD RATES</p>
          <h2>Start with your tariff</h2>
          <p className="section-copy">
            Use VAT-inclusive rates from your bill. Standing charges are shown
            separately from energy costs.
          </p>
          <form className="field-grid" onSubmit={save}>
            <label className="wide">
              Tariff name · optional
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="A name is generated if left blank"
                maxLength={80}
              />
            </label>
            <label className="wide">
              Tariff type
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "single" | "tou")}
              >
                <option value="single">Single rate</option>
                <option value="tou">Peak / off-peak schedule</option>
              </select>
            </label>
            <label>
              {kind === "tou" ? "Peak rate" : "Unit rate"} · p/kWh
              <input
                type="number"
                min="-100"
                max="1000"
                step="0.001"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="From your bill"
                required
              />
            </label>
            <label>
              Standing charge · p/day
              <input
                type="number"
                min="0"
                max="1000"
                step="0.001"
                value={standing}
                onChange={(e) => setStanding(e.target.value)}
                placeholder="From your bill"
                required
              />
            </label>
            {kind === "tou" && (
              <>
                <label className="wide">
                  Off-peak rate · p/kWh
                  <input
                    type="number"
                    min="-100"
                    max="1000"
                    step="0.001"
                    value={offPeak}
                    onChange={(e) => setOffPeak(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Off-peak begins
                  <input
                    type="time"
                    step="1800"
                    value={offStart}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Off-peak ends
                  <input
                    type="time"
                    step="1800"
                    value={offEnd}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />
                </label>
                <p className="small wide">
                  Schedule repeats daily in Europe/London, including clock
                  changes. Use a separate scenario if your tariff has more than
                  two rates or different weekend schedules.
                </p>
              </>
            )}
            <button className="action-button wide" type="submit">
              Use these rates ↗
            </button>
          </form>
        </section>
      </details>
      {error && (
        <p className="form-message wide" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message wide" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
