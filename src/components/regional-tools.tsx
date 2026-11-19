"use client";
import { useEffect, useState } from "react";
import { SeriesChart, localTime } from "./series-chart";
import { LocalDemand } from "./local-demand";
import { BritainInsights, GridHeartbeat } from "./britain-insights";
import type { AreaData } from "@/types/area";
import type { Insights } from "@/types/insights";
import type { History, Snapshot } from "@/types/electricity";

export function DemandTools({
  data,
  error,
  regionName,
}: {
  data: Insights | null;
  error: string;
  regionName: string;
}) {
  const [tab, setTab] = useState("national");
  return (
    <>
      <p className="section-copy">
        {regionName === "Great Britain"
          ? "National demand observations and annual local consumption have different boundaries and time scales."
          : `${regionName}: live demand in MW is not available from the connected regional feed. National observations and annual local consumption remain separate views.`}
      </p>
      <div className="tab-strip" aria-label="Demand views">
        <button
          aria-pressed={tab === "national"}
          onClick={() => setTab("national")}
        >
          National demand
        </button>
        <button aria-pressed={tab === "local"} onClick={() => setTab("local")}>
          Annual local use
        </button>
      </div>
      {tab === "national" ? (
        <BritainInsights
          view="demand"
          data={data}
          error={error}
          onLocal={() => setTab("local")}
        />
      ) : (
        <LocalDemand />
      )}
    </>
  );
}
function RegionalForecast({ area }: { area: AreaData | null }) {
  if (!area)
    return (
      <p className="empty-state">
        Choose a region on the page to load its regional carbon forecast.
      </p>
    );
  return (
    <section>
      <p className="eyebrow">{area.name} · REGIONAL FORECAST</p>
      <h2>How clean could your region be?</h2>
      <SeriesChart
        unit="gCO₂/kWh"
        maxGapMinutes={35}
        series={[
          {
            label: area.name + " · NESO carbon",
            color: "#9ae4dd",
            dashed: true,
            points: area.intervals
              .filter((r) => r.intensity !== null)
              .map((r) => ({ at: r.from, value: r.intensity! })),
          },
        ]}
      />
      <p className="small">
        NESO · retrieved {localTime(area.retrievedAt)}
        {area.stale ? " · delayed" : ""}. Forecasts can change. Lower carbon
        does not necessarily mean a lower tariff price.
      </p>
    </section>
  );
}
function Replay({
  onFrame,
  onNow,
}: {
  onFrame: (s: Snapshot) => void;
  onNow: () => void;
}) {
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState(""),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/history", { signal: c.signal })
      .then(async (r) => {
        if (!r.ok)
          throw Error(
            "Historical observations are unavailable. Please reopen this tool to retry.",
          );
        return r.json() as Promise<History>;
      })
      .then((h) => {
        if (!c.signal.aborted) {
          setHistory(h);
          setIndex(h.snapshots.length - 1);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);
  useEffect(() => {
    if (!history || !playing) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => Math.min(i + 1, history.snapshots.length - 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [history, playing]);
  useEffect(() => {
    if (history && index === history.snapshots.length - 1) setPlaying(false);
  }, [history, index]);
  const frame = history?.snapshots[index];
  return (
    <section>
      <h2>Replay the last 24 hours</h2>
      <p className="section-copy">
        Choose an observation to apply it to the map. Regional fuel mix is not
        available in this archive; national totals and archived regional carbon
        stay distinct.
      </p>
      {error ? (
        <p className="form-message" role="status">
          {error}
        </p>
      ) : !history ? (
        <p role="status">Loading historical observations…</p>
      ) : (
        <>
          <label className="replay-control">
            Observation · {frame ? localTime(frame.requestedAt) : "Unavailable"}
            <input
              type="range"
              min={0}
              max={Math.max(0, history.snapshots.length - 1)}
              value={index}
              aria-valuetext={
                frame ? localTime(frame.requestedAt) : "Unavailable"
              }
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
            />
          </label>
          <SeriesChart
            unit="GW"
            maxGapMinutes={35}
            series={[
              {
                label: "National demand · INDO",
                color: "#9ae4dd",
                points: history.snapshots
                  .filter((s) => s.demand)
                  .map((s) => ({
                    at: s.requestedAt,
                    value: s.demand!.mw / 1000,
                  })),
              },
            ]}
          />
          <div className="replay-actions">
            <button
              className="action-button"
              disabled={!frame}
              onClick={() => frame && onFrame(frame)}
            >
              Show observation on map
            </button>
            <button
              className="subtle-button"
              onClick={() => {
                if (index === history.snapshots.length - 1) setIndex(0);
                setPlaying(!playing);
              }}
            >
              {playing ? "Pause timeline" : "Play timeline"}
            </button>
            <button
              className="text-button"
              onClick={() => {
                setPlaying(false);
                onNow();
              }}
            >
              Return to latest
            </button>
          </div>
          <p className="small">
            Timeline playback previews the series; use Show observation on map
            to apply the selected timestamp. Motion on the map is illustrative.
          </p>
        </>
      )}
    </section>
  );
}
export function ForecastTools({
  area,
  areaError,
  data,
  error,
  onFrame,
  onNow,
}: {
  area: AreaData | null;
  areaError: string;
  data: Insights | null;
  error: string;
  onFrame: (s: Snapshot) => void;
  onNow: () => void;
}) {
  const [tab, setTab] = useState(area ? "regional" : "national");
  return (
    <>
      <div className="tab-strip" aria-label="Forecast views">
        {[
          ["regional", "Regional carbon"],
          ["national", "Britain outlook"],
          ["replay", "24h replay"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "regional" ? (
        <>
          {areaError && (
            <p className="form-message" role="status">
              Regional forecast could not refresh. Last received data, if any,
              is shown.
            </p>
          )}
          <RegionalForecast area={area} />
        </>
      ) : tab === "national" ? (
        <BritainInsights view="outlook" data={data} error={error} />
      ) : (
        <Replay onFrame={onFrame} onNow={onNow} />
      )}
    </>
  );
}
export { CountryFlows as Connections } from "./country-flows";
export { GridHeartbeat };
