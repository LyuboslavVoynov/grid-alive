"use client";
import { useEffect, useState } from "react";
import { countryTransfers } from "@/lib/geo/interconnectors";
import type { History, Snapshot } from "@/types/electricity";
import { localTime } from "./series-chart";
const mw = (n: number) =>
  Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 });
export function CountryFlowSummary({
  snapshot,
  onOpen,
  onSelect,
  selectedCountry,
  selectedDirection,
}: {
  snapshot: Snapshot | null;
  onOpen: () => void;
  onSelect?: (country: string, direction: "import" | "export") => void;
  selectedCountry?: string | null;
  selectedDirection?: "import" | "export";
}) {
  const generation = snapshot?.generation;
  const countries = countryTransfers(generation?.interconnectors ?? {});
  return (
    <section className="country-preview">
      <p className="eyebrow">ACROSS OUR BORDERS · GB</p>
      <button className="country-preview-title" onClick={onOpen}>
        Imports & exports <span>↗</span>
      </button>
      {generation ? (
        <>
          <div className="country-chips">
            {countries.map((c) => (
              <article className="country-source-card" key={c.country}>
                <h3>
                  <span aria-hidden="true">{c.flag || "↔"}</span>
                  {c.country}
                </h3>
                {(["import", "export"] as const).map((direction) => {
                  const value =
                    direction === "import" ? c.importsMw : c.exportsMw;
                  if (!value && c.missing === 0) return null;
                  return (
                    <button
                      key={direction}
                      aria-pressed={
                        selectedCountry === c.country &&
                        selectedDirection === direction
                      }
                      aria-label={`${c.country} ${direction}: ${value.toLocaleString("en-GB")} MW${c.missing ? ", incomplete readings" : ""}. Show on map`}
                      onClick={() =>
                        onSelect ? onSelect(c.country, direction) : onOpen()
                      }
                    >
                      <span>
                        {direction === "import" ? "↓ Into GB" : "↑ From GB"}
                      </span>
                      <b>
                        {c.missing
                          ? "Partial"
                          : `${(value / 1000).toFixed(1)} GW`}
                      </b>
                    </button>
                  );
                })}
                {!c.importsMw && !c.exportsMw && !c.missing && (
                  <p className="small">0 MW · no transfer</p>
                )}
              </article>
            ))}
          </div>
          <p className="small">
            Select a country to see its connection ·{" "}
            {localTime(generation.from)}
            {generation.stale ? " · delayed" : ""}. Connected grids, not
            original generation countries.
          </p>
        </>
      ) : (
        <p className="small">Transfer observations unavailable.</p>
      )}
    </section>
  );
}

function Sparkline({
  history,
  country,
}: {
  history: History;
  country: string;
}) {
  const points = history.snapshots.map((s) => {
    const c = s.generation
      ? countryTransfers(s.generation.interconnectors).find(
          (c) => c.country === country,
        )
      : null;
    return {
      at: Date.parse(s.requestedAt),
      value: c && !c.missing ? c.netMw : null,
    };
  });
  const valid = points.filter((p) => p.value !== null && Number.isFinite(p.at));
  if (valid.length < 2)
    return <p className="small">Not enough complete history for a trend.</p>;
  const start = points[0].at,
    end = points.at(-1)!.at,
    scale = Math.max(1, ...valid.map((p) => Math.abs(p.value!)));
  const paths: string[] = [];
  let run = "";
  let previous = 0;
  for (const p of points) {
    if (p.value === null || !Number.isFinite(p.at)) {
      if (run) paths.push(run);
      run = "";
      continue;
    }
    if (previous && p.at - previous > 35 * 60000) {
      if (run) paths.push(run);
      run = "";
    }
    const x = 5 + (230 * (p.at - start)) / Math.max(1, end - start),
      y = 32 - (26 * p.value) / scale;
    run += `${run ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    previous = p.at;
  }
  if (run) paths.push(run);
  return (
    <div className="country-trend">
      <svg
        viewBox="0 0 240 64"
        role="img"
        aria-label={`${country} net transfer over the past 24 hours; above the line is import, below is export. Scale plus or minus ${mw(scale)} MW.`}
      >
        <title>
          {country} · net transfer · ±{mw(scale)} MW
        </title>
        <path d="M5 32H235" stroke="#536874" strokeDasharray="3 4" />
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#9ae4dd" strokeWidth="1.6" />
        ))}
      </svg>
      <span>24h · net MW · above line = import · ±{mw(scale)} MW</span>
    </div>
  );
}
export function CountryFlows({
  snapshot,
  onMap,
}: {
  snapshot: Snapshot | null;
  onMap?: () => void;
}) {
  const generation = snapshot?.generation;
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/history", { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Transfer trends unavailable.");
        return r.json() as Promise<History>;
      })
      .then((h) => {
        if (!c.signal.aborted) setHistory(h);
      })
      .catch(() => {
        if (!c.signal.aborted) setError("Transfer trends unavailable.");
      });
    return () => c.abort();
  }, []);
  if (!generation)
    return <p className="empty-state">Transfer observations unavailable.</p>;
  const countries = countryTransfers(generation.interconnectors),
    imports = countries.reduce((n, c) => n + c.importsMw, 0),
    exports = countries.reduce((n, c) => n + c.exportsMw, 0),
    missing = countries.reduce((n, c) => n + c.missing, 0);
  return (
    <section className="country-flows">
      <p className="eyebrow">BRITAIN & ITS NEIGHBOURS</p>
      <h2>Electricity across our borders</h2>
      <p className="section-copy">
        Reported cable transfers at {localTime(generation.from)}
        {generation.stale ? " · delayed" : ""}
        {snapshot?.mode === "historical" ? " · historical observation" : ""}.
        Follow electricity entering and leaving GB through its neighbouring
        grids. These are GB-wide transfers, not supply to your selected region.
      </p>
      <div className="border-totals">
        <div>
          <span>↓ Into GB</span>
          <strong>
            {(imports / 1000).toFixed(2)} <small>GW</small>
          </strong>
        </div>
        <div>
          <span>↑ Out of GB</span>
          <strong>
            {(exports / 1000).toFixed(2)} <small>GW</small>
          </strong>
        </div>
        <div>
          <span>{imports >= exports ? "Net import" : "Net export"}</span>
          <strong>
            {(Math.abs(imports - exports) / 1000).toFixed(2)} <small>GW</small>
          </strong>
        </div>
      </div>
      {missing > 0 && (
        <p className="form-message">
          {missing} cable reading{missing === 1 ? " is" : "s are"} unavailable.
          Totals include reported readings only; missing is not zero.
        </p>
      )}
      <p className="small">
        Percentages show each neighbour’s share of reported imports to GB.
      </p>
      {onMap && (
        <button className="action-button" onClick={onMap}>
          Follow transfers on the map ↗
        </button>
      )}
      {history && (
        <p className="small">
          Trend period: {localTime(history.from)} → {localTime(history.to)}
        </p>
      )}
      <div className="country-cards">
        {countries.map((c) => (
          <article className="country-card" key={c.country}>
            <div className="country-card-heading">
              <span className="country-flag" aria-hidden="true">
                {c.flag || "↔"}
              </span>
              <h3>{c.country}</h3>
              <span className="country-share">
                {c.missing === c.links.length
                  ? "No reading"
                  : c.importsMw > 0 && imports
                    ? `${((100 * c.importsMw) / imports).toFixed(1)}% of imports`
                    : c.exportsMw > 0
                      ? "Exporting"
                      : "No transfer"}
              </span>
            </div>
            <div className="country-directions">
              <span>
                ↓ Import{" "}
                <b>
                  {c.missing === c.links.length ? "—" : mw(c.importsMw) + " MW"}
                </b>
              </span>
              <span>
                ↑ Export{" "}
                <b>
                  {c.missing === c.links.length ? "—" : mw(c.exportsMw) + " MW"}
                </b>
              </span>
            </div>
            {c.missing > 0 && (
              <p className="small">
                {c.missing === c.links.length
                  ? "Readings unavailable; displayed totals have no reported contribution."
                  : "Partial total · some cable readings unavailable."}
              </p>
            )}
            <div className="country-volume" aria-hidden="true">
              <span
                style={{
                  width: `${imports ? (100 * c.importsMw) / imports : 0}%`,
                }}
              />
            </div>
            {history ? (
              <Sparkline history={history} country={c.country} />
            ) : (
              <p className="small">{error || "Loading 24h transfer trend…"}</p>
            )}
            <details>
              <summary>Individual cables · {c.links.length}</summary>
              <ul>
                {c.links.map((l) => (
                  <li key={l.id}>
                    <span>{l.name}</span>
                    <b>
                      {l.mw === null
                        ? "Unavailable"
                        : l.mw === 0
                          ? "No transfer"
                          : `${l.mw > 0 ? "↓ Import" : "↑ Export"} · ${mw(l.mw)} MW`}
                    </b>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
      <details className="country-reading-note">
        <summary>How to read these flows</summary>
        <p>
          These readings identify the neighbouring grid, not the original
          generating station or onward supply to a British region. Northern
          Ireland is a separate connected electricity system. Map routes are
          schematic. Trends cover the last available 24 hours, can end at a
          different time from current readings, and leave gaps where complete
          country data is unavailable.
        </p>
      </details>
      <p className="small">
        Elexon / NESO operational metering · each trend has its own labelled
        scale. Generation and demand have independent coverage; transfer totals
        are not a complete GB energy balance.
      </p>
    </section>
  );
}
