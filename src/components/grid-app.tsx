"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EnergyMap, type MapControls } from "./map/energy-map";
import { energyAssets, type EnergyAsset } from "@/lib/geo/assets";
import type { Snapshot, History, Regional } from "@/types/electricity";
const symbols: Record<string, string> = {
  wind: "〰",
  solar: "☼",
  nuclear: "✧",
  gas: "♧",
  hydro: "♢",
  biomass: "♧",
  other: "•••",
};
const gw = (mw: number) => `${(mw / 1000).toFixed(1)} GW`;
export default function GridApp() {
  const [showOverlays, setShowOverlays] = useState(true);
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [wind, setWind] = useState(true),
    [connections, setConnections] = useState(true),
    [cities, setCities] = useState(true),
    [mixOpen, setMixOpen] = useState(false),
    [selected, setSelected] = useState<EnergyAsset | null>(null),
    [controls, setControls] = useState<MapControls | null>(null);
  const [latest, setSnapshot] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [networkError, setNetworkError] = useState(false);
  const [history, setHistory] = useState<History | null>(null),
    [historyIndex, setHistoryIndex] = useState<number | null>(null),
    [historyLoading, setHistoryLoading] = useState(false),
    [historyError, setHistoryError] = useState(""),
    [regional, setRegional] = useState<Regional | null>(null),
    [mode, setMode] = useState<"flow" | "carbon" | "connections">("flow");
  const snapshot =
    historyIndex !== null && history ? history.snapshots[historyIndex] : latest;
  const activeRegional =
    historyIndex !== null ? (snapshot?.regional ?? null) : regional;
  async function loadHistory() {
    if (history) {
      setHistoryIndex(history.snapshots.length - 1);
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await fetch("/api/history");
      if (!response.ok) throw Error();
      const data = (await response.json()) as History;
      setHistory(data);
      setHistoryIndex(data.snapshots.length - 1);
    } catch {
      setHistoryError("History is unavailable. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/regional", {
          signal: controller.signal,
        });
        if (!response.ok) throw Error();
        const data = (await response.json()) as Regional;
        if (!disposed) setRegional(data);
      } catch {
        if (!disposed) setRegional(null);
      }
    }
    void refresh();
    const timer = setInterval(refresh, 300000);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (historyIndex === null || !playing || !history) return;
    if (historyIndex === history.snapshots.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setInterval(
      () =>
        setHistoryIndex((i) =>
          i === null ? null : Math.min(i + 1, history.snapshots.length - 1),
        ),
      1500 / speed,
    );
    return () => clearInterval(timer);
  }, [historyIndex, playing, history, speed]);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/grid", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw Error("Grid data unavailable");
        const next = (await response.json()) as Snapshot;
        if (!disposed) {
          setSnapshot(next);
          setNetworkError(false);
        }
      } catch {
        if (!disposed) setNetworkError(true);
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!media.matches);
    const change = () => setPlaying(!media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const onControls = useCallback(
    (value: MapControls) => setControls(value),
    [],
  );
  const settings = useMemo(
    () => ({
      playing,
      speed,
      wind,
      connections,
      cities,
      windActivity: snapshot?.generation?.fuels.find((f) => f.key === "wind")
        ?.share
        ? Math.min(
            (snapshot.generation.fuels.find((f) => f.key === "wind")?.share ??
              0) / 45,
            1,
          )
        : 0,
      flows: snapshot?.generation?.interconnectors ?? {},
    }),
    [playing, speed, wind, connections, cities, snapshot],
  );
  const generation = snapshot?.generation,
    carbon = snapshot?.carbon,
    demand = snapshot?.demand;
  const fuels = (generation?.fuels ?? []).filter(
    (f) => f.mw > 0 || !["coal", "oil"].includes(f.key),
  );
  const stale =
    (networkError && historyIndex === null) ||
    [
      generation,
      demand,
      carbon,
      mode === "carbon" ? activeRegional : null,
    ].some((x) => x?.stale);
  const status =
    historyIndex !== null
      ? "HISTORICAL REPLAY"
      : loading
        ? "CONNECTING"
        : stale
          ? "DATA DELAYED"
          : snapshot?.errors.length
            ? "PARTIAL DATA"
            : "LATEST OBSERVATIONS";
  const time = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(value));
  return (
    <main
      className={`${playing ? "" : "paused"} ${mixOpen ? "mix-open" : ""} ${showOverlays ? "" : "overlays-hidden"}`}
    >
      <EnergyMap
        settings={{ ...settings, wind: wind && mode !== "carbon" }}
        onControls={onControls}
        onSelect={setSelected}
        mode={mode}
        regional={activeRegional}
      />
      <div className="vignette" />
      <header>
        <a className="brand" href="/" aria-label="GRID ALIVE home">
          GRID <i>/</i> ALIVE
        </a>
        <div className="status">
          <span /> {status}{" "}
          <b>
            {historyIndex !== null && snapshot
              ? time(snapshot.requestedAt)
              : generation
                ? time(generation.from)
                : "GREAT BRITAIN"}
          </b>
        </div>
        <button
          className="overlay-toggle"
          aria-pressed={!showOverlays}
          onClick={() => setShowOverlays(!showOverlays)}
        >
          {showOverlays ? "Hide panels" : "Show panels"}
        </button>
      </header>
      <aside className="summary" aria-label="Generation mix">
        <p className="eyebrow">GENERATION MIX</p>
        <div className="total">
          {generation ? (generation.totalMw / 1000).toFixed(1) : "—"}{" "}
          <span>GW</span>
        </div>
        <p className="subhead">Metered generation · storage separate</p>
        <button
          className="mix-toggle"
          aria-expanded={mixOpen}
          aria-controls="mix-detail"
          onClick={() => setMixOpen(!mixOpen)}
        >
          Generation split <span>{mixOpen ? "−" : "＋"}</span>
        </button>
        <div id="mix-detail">
          <div className="mix-layout">
            <div className="mix-bar" aria-hidden="true">
              {fuels
                .filter((f) => f.share > 0)
                .map((f) => (
                  <span
                    key={f.key}
                    style={{ background: f.color, flex: f.share }}
                  />
                ))}
            </div>
            <table aria-label="Metered generation shares">
              <tbody>
                {fuels.map((f) => (
                  <tr key={f.key}>
                    <th scope="row">
                      <span className="fuel" style={{ color: f.color }}>
                        {symbols[f.key] ?? "•"}
                      </span>
                      {f.label}
                    </th>
                    <td>{gw(f.mw)}</td>
                    <td>{f.share.toFixed(1)}%</td>
                  </tr>
                ))}
                {!fuels.some((fuel) => fuel.key === "solar") && (
                  <tr className="unavailable-fuel">
                    <th scope="row">
                      <span className="fuel" style={{ color: "#dfba77" }}>
                        ☼
                      </span>
                      Solar
                    </th>
                    <td colSpan={2}>Not reported</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <dl className="balance">
            <div>
              <dt>Demand</dt>
              <dd>{demand ? gw(demand.mw) : "—"}</dd>
            </div>
            <div>
              <dt>
                {generation && generation.netImportsMw < 0
                  ? "Net exports"
                  : "Net imports"}
              </dt>
              <dd>
                {generation ? gw(Math.abs(generation.netImportsMw)) : "—"}
              </dd>
            </div>
            <div>
              <dt>Pumped storage</dt>
              <dd>{generation ? gw(generation.storageMw) : "—"}</dd>
            </div>
          </dl>
          <p className="demo">
            {generation ? (
              <>
                Elexon · {time(generation.from)}
                {generation.stale ? " · delayed" : ""}
                <br />
                Embedded generation not fully covered.
              </>
            ) : loading ? (
              "Connecting to Elexon…"
            ) : (
              "Generation data unavailable."
            )}
            <br />
            {demand ? (
              <>
                Demand: {time(demand.from)}
                {demand.stale ? " · delayed" : ""}
              </>
            ) : null}
            <br />
            <a href="/methodology">Coverage & definitions</a>
          </p>
        </div>
      </aside>
      <aside className="market" aria-label="Carbon intensity">
        <p className="eyebrow">CARBON INTENSITY</p>
        <div className="carbon">
          <div>
            {carbon?.intensity ?? "—"} <span>gCO₂ / kWh</span>
          </div>
          <p className="period">
            {carbon
              ? `NESO · ${carbon.quality} · ${time(carbon.from)}`
              : loading
                ? "Connecting to NESO…"
                : "Carbon intensity unavailable"}
            {carbon?.stale ? " · delayed" : ""}
          </p>
        </div>
      </aside>
      <div className="north" aria-hidden="true">
        <span>↑</span>N
      </div>
      <section className="map-tools" aria-label="Map controls">
        <button onClick={() => controls?.zoomIn()} aria-label="Zoom in">
          +
        </button>
        <button onClick={() => controls?.zoomOut()} aria-label="Zoom out">
          −
        </button>
        <button onClick={() => controls?.reset()} aria-label="Reset map view">
          ⌖
        </button>
      </section>
      {historyError ||
      snapshot?.errors.length ||
      (networkError && historyIndex === null) ? (
        <div className="data-warning" role="status">
          {historyError ||
            (networkError && historyIndex === null
              ? "Connection interrupted. Last received observations shown."
              : snapshot?.errors.join(" · "))}
        </div>
      ) : null}
      {mode === "flow" && (
        <div className="hint">
          <span className="pulse" />
          <span>
            OFFSHORE WIND<b>Rotating turbines · illustrative flow</b>
          </span>
        </div>
      )}
      {selected && (
        <section className="asset-panel" aria-label="Selected location">
          <button
            className="close"
            onClick={() => setSelected(null)}
            aria-label="Close location details"
          >
            ×
          </button>
          <p className="eyebrow">{selected.technology.toUpperCase()}</p>
          <h2>{selected.name}</h2>
          <dl className="asset-facts">
            <div>
              <dt>Installed capacity</dt>
              <dd>{selected.capacityMw.toLocaleString("en-GB")} MW</dd>
            </div>
            {selected.turbines !== null && (
              <div>
                <dt>Recorded turbines</dt>
                <dd>{selected.turbines}</dd>
              </div>
            )}
            <div>
              <dt>Measured output</dt>
              <dd>Not available</dd>
            </div>
          </dl>
          <p>
            {selected.status} · {selected.country}. REPD July 2026 snapshot;
            approximate site reference point.
          </p>
          <p>
            Symbols and motion are illustrative. National wind observations do
            not establish output at this site.
          </p>
          <a
            href="https://www.gov.uk/government/publications/renewable-energy-planning-database-quarterly-extract"
            target="_blank"
            rel="noreferrer"
          >
            Government source ↗
          </a>
        </section>
      )}
      <label className="asset-picker">
        <span>EXPLORE A RENEWABLE SITE</span>
        <select
          value={selected?.id ?? ""}
          onChange={(e) =>
            setSelected(
              energyAssets.find((a) => a.id === e.target.value) ?? null,
            )
          }
        >
          <option value="">
            Select from {energyAssets.length} featured sites
          </option>
          {energyAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {mode === "carbon" && (
        <section
          className="carbon-legend"
          aria-label="Regional carbon intensity"
        >
          <p className="eyebrow">REGIONAL CARBON · FORECAST</p>
          <div className="carbon-ramp" />
          <div className="legend-scale">
            <span>0</span>
            <span>250</span>
            <span>500+</span>
          </div>
          <p>gCO₂/kWh · approximate DNO areas</p>
          <p>
            {activeRegional
              ? `NESO · ${time(activeRegional.from)}${activeRegional.stale ? " · delayed" : ""}`
              : "Regional source unavailable"}
          </p>
          {!activeRegional && (
            <p className="empty">No regional data for this period.</p>
          )}
          <details>
            <summary>View all regional values</summary>
            <ul>
              {activeRegional?.regions.map((r) => (
                <li key={r.id}>
                  {r.name}
                  <b>{r.intensity}</b>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
      {mode === "connections" && (
        <section
          className="connection-panel"
          aria-label="Reported international transfers"
        >
          <p className="eyebrow">INTERNATIONAL CONNECTIONS</p>
          <p className="small">
            {generation ? time(generation.from) : "No observation"} · MW
          </p>
          <ul>
            {Object.entries(generation?.interconnectors ?? {}).map(
              ([id, mw]) => (
                <li key={id}>
                  <span>
                    {(
                      {
                        INTFR: "France · IFA",
                        INTIFA2: "France · IFA2",
                        INTELEC: "France · ElecLink",
                        INTNED: "Netherlands · BritNed",
                        INTNEM: "Belgium · Nemo",
                        INTNSL: "Norway · NSL",
                        INTVKL: "Denmark · Viking",
                        INTEW: "Ireland · East-West",
                        INTGRNL: "Ireland · Greenlink",
                        INTIRL: "Northern Ireland · Moyle",
                      } as Record<string, string>
                    )[id] ?? id}
                  </span>
                  <b>
                    {mw > 0 ? "↙" : mw < 0 ? "↗" : "—"}{" "}
                    {Math.abs(mw).toLocaleString("en-GB")}
                  </b>
                </li>
              ),
            )}
          </ul>
          <p className="small">
            ↙ Imports to GB · ↗ Exports from GB
            <br />
            Map routes are schematic, not surveyed cables.
          </p>
        </section>
      )}
      <footer>
        <div className="mode-switch" aria-label="Visualisation mode">
          {(["flow", "carbon", "connections"] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setSelected(null);
              }}
            >
              {m === "flow"
                ? "Energy flow"
                : m === "carbon"
                  ? "Carbon"
                  : "Connections"}
            </button>
          ))}
        </div>
        <div className="layers" aria-label="Visual layers">
          <button onClick={() => setWind(!wind)} aria-pressed={wind}>
            Wind farms
          </button>
          <button
            onClick={() => setConnections(!connections)}
            aria-pressed={connections}
          >
            Connections
          </button>
          <button onClick={() => setCities(!cities)} aria-pressed={cities}>
            City lights
          </button>
        </div>
        <div className="transport">
          <button
            onClick={() => {
              if (
                history &&
                historyIndex === history.snapshots.length - 1 &&
                !playing
              )
                setHistoryIndex(0);
              setPlaying(!playing);
            }}
            aria-label={playing ? "Pause animation" : "Play animation"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <span className="transport-label">
            {historyIndex !== null
              ? "HISTORICAL REPLAY"
              : "ILLUSTRATIVE MOTION"}
          </span>
          {historyIndex !== null && history ? (
            <input
              type="range"
              className="history-range"
              aria-label="Historical observation time"
              aria-valuetext={snapshot ? time(snapshot.requestedAt) : ""}
              min={0}
              max={history.snapshots.length - 1}
              step={1}
              value={historyIndex}
              onChange={(e) => {
                setPlaying(false);
                setHistoryIndex(Number(e.target.value));
              }}
            />
          ) : (
            <div className="track">
              <span />
            </div>
          )}
          <button
            className="history-button"
            onClick={() => {
              if (historyIndex !== null) {
                setHistoryIndex(null);
                setPlaying(
                  !matchMedia("(prefers-reduced-motion: reduce)").matches,
                );
              } else {
                setPlaying(false);
                void loadHistory();
              }
            }}
            disabled={historyLoading}
            aria-label={
              historyIndex !== null
                ? "Return to latest observations"
                : "Explore the last 24 hours"
            }
          >
            {historyLoading
              ? "Loading…"
              : historyIndex !== null
                ? "Now"
                : "24h"}
          </button>
          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
            aria-label="Change animation speed"
          >
            {speed}×
          </button>
          <span className="motion-state">{playing ? "Running" : "Paused"}</span>
        </div>
        <div className="footnote">
          <span>
            GREAT BRITAIN <em>·</em> Metered observations <em>·</em> Flow paths
            illustrative
          </span>
          <a href="/methodology">Sources & methodology</a>
        </div>
      </footer>
    </main>
  );
}
