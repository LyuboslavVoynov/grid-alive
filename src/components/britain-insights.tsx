"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Insights } from "@/types/insights";
import { SeriesChart, localTime } from "./series-chart";
export function useInsights() {
  const [data, setData] = useState<Insights | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    async function load() {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/insights", { signal: controller.signal });
        if (!r.ok) throw Error();
        const v = await r.json();
        if (!disposed) {
          setData(v);
          setError("");
        }
      } catch {
        if (!disposed)
          setError("Grid insights are unavailable. Please try again shortly.");
      }
    }
    void load();
    const timer = setInterval(load, 300000);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  return { data, error };
}
export function GridHeartbeat({ data }: { data: Insights | null }) {
  return (
    <div className="heartbeat">
      <p className="eyebrow">GRID HEARTBEAT</p>
      <div className="heartbeat-value">
        {data?.frequency?.hz.toFixed(3) ?? "—"}
        <span> Hz</span>
      </div>
      <p>Frequency reflects system balance around 50 Hz.</p>
      <p className="small">
        {data?.frequency
          ? `Elexon · ${localTime(data.frequency.at)}${data.frequency.delayed ? " · delayed" : ""}`
          : "Frequency unavailable"}
      </p>
    </div>
  );
}
export function BritainInsights({
  view,
  data,
  error,
}: {
  view: "demand" | "outlook";
  data: Insights | null;
  error: string;
}) {
  const now = Date.now(),
    start = now - 24 * 3600000;
  const current = data?.demand.at(-1);
  // Compare the matching UTC settlement interval, not unmatched local hours on DST days.
  const prior = current
    ? data?.demand.find(
        (p) => Date.parse(p.at) === Date.parse(current.at) - 24 * 3600000,
      )
    : null;
  const change =
    current && prior
      ? ((current.value - prior.value) / prior.value) * 100
      : null;
  const [outlookMetric, setMetric] = useState<"demand" | "wind" | "carbon">(
    "demand",
  );
  const points =
    outlookMetric === "demand"
      ? data?.demandForecast
      : outlookMetric === "wind"
        ? data?.windForecast
        : data?.carbonForecast;
  return (
    <section
      className="insight-drawer"
      aria-label={
        view === "demand" ? "National demand insights" : "Forecast outlook"
      }
    >
      <div className="insight-title">
        <div>
          <p className="eyebrow">
            {view === "demand"
              ? "OBSERVED NATIONAL DEMAND"
              : "PUBLISHED OUTLOOK"}
          </p>
          <h2>
            {view === "demand"
              ? "Why demand changes"
              : "Explore what comes next"}
          </h2>
        </div>
        {view === "demand" && current ? (
          <div className="demand-highlight">
            {(current.value / 1000).toFixed(1)} <small>GW</small>
            <p>
              {change === null
                ? "Comparison unavailable"
                : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs 24 hours earlier`}
            </p>
          </div>
        ) : null}
      </div>
      {error ? (
        <p role="status">{error}</p>
      ) : !data ? (
        <p role="status">Loading published grid insights…</p>
      ) : view === "demand" ? (
        <>
          <SeriesChart
            unit="GW"
            from={start}
            to={now}
            maxGapMinutes={35}
            series={[
              {
                label: "Latest 24h · INDO",
                color: "#76dfd1",
                points: data.demand.map((p) => ({
                  ...p,
                  value: p.value / 1000,
                })),
              },
              {
                label: "Previous 24h · aligned UTC",
                color: "#8a99ad",
                points: data.demand
                  .filter((p) => Date.parse(p.at) < start)
                  .map((p) => ({
                    ...p,
                    at: new Date(Date.parse(p.at) + 24 * 3600000).toISOString(),
                    value: p.value / 1000,
                  })),
              },
            ]}
          />
          <p className="insight-caption">
            Observed electricity demand varies across the day. This national
            series does not identify live household, business or city demand.{" "}
            <Link href="/area">Explore annual local consumption ↗</Link>
          </p>
        </>
      ) : (
        <>
          <div className="tab-strip" aria-label="Forecast metric">
            {(["demand", "wind", "carbon"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={outlookMetric === m}
                onClick={() => setMetric(m)}
              >
                {m === "carbon"
                  ? "Carbon intensity"
                  : m === "wind"
                    ? "Wind outlook"
                    : "Demand"}
              </button>
            ))}
          </div>
          <SeriesChart
            unit={outlookMetric === "carbon" ? "gCO₂/kWh" : "GW"}
            from={now}
            to={now + 48 * 3600000}
            now={now}
            series={[
              {
                label:
                  outlookMetric === "carbon"
                    ? "NESO carbon"
                    : `Elexon ${outlookMetric}`,
                color: outlookMetric === "carbon" ? "#dbbf78" : "#76dfd1",
                dashed: true,
                points: (points ?? []).map((p) => ({
                  ...p,
                  value: outlookMetric === "carbon" ? p.value : p.value / 1000,
                })),
              },
            ]}
          />
          <p className="insight-caption">
            Forecasts are uncertain. Only published periods appear; gaps remain
            blank. Demand and wind coverage may be shorter than 48 hours.
          </p>
          <details className="grid-context">
            <summary>Station availability & operational context</summary>
            <p>
              Latest published REMIT messages overlapping this window; a
              selected set, not all system outages. Availability is declared
              capacity, not measured output or a household outage warning.
            </p>
            {data.notices.length ? (
              data.notices.map((n) => (
                <article key={n.id}>
                  <b>
                    {n.unit} · {n.title}
                  </b>
                  <span>
                    {n.status} ·{" "}
                    {n.unavailableMw === null
                      ? "Capacity unavailable"
                      : `${n.unavailableMw} MW unavailable`}
                  </span>
                  <span>
                    {localTime(n.from)} → {localTime(n.to)}
                  </span>
                  <a
                    href={`https://bmrs.elexon.co.uk/remit`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Elexon REMIT ↗ · published {localTime(n.publishedAt)}
                  </a>
                </article>
              ))
            ) : (
              <p>No notices available.</p>
            )}
          </details>
        </>
      )}
      {data?.errors.length ? (
        <p className="small" role="status">
          {data.errors.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
