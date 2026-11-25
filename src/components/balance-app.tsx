"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MapControls } from "./map/energy-map";
import { MobileIcon } from "./mobile-icon";
const EnergyMap = dynamic(
  () => import("./map/energy-map").then((m) => m.EnergyMap),
  {
    ssr: false,
    loading: () => (
      <p className="map-loading" role="status">
        Loading electricity map…
      </p>
    ),
  },
);
import { ToolDialog } from "./tool-dialog";
import { InteractionEffects } from "./interaction-effects";
import { EnergyTools } from "./energy-tools";
import { GenerationSplit } from "./generation-split";
import { CountryFlowSummary } from "./country-flows";
import { Methodology } from "./methodology";
import {
  Connections,
  DemandTools,
  ForecastTools,
  GridHeartbeat,
} from "./regional-tools";
import { useInsights } from "./britain-insights";
import { useGridData } from "./use-grid-data";
import { useEnergyWorkspace } from "./energy-workspace";
import { localTime } from "./series-chart";
import { gridRegions } from "@/lib/geo/regions";
import { energyAssets, type EnergyAsset } from "@/lib/geo/assets";
import { distanceKm } from "@/lib/geo/distance";
import { sourceFuels, type SourceFuel } from "@/lib/geo/night-atlas";
import {
  countryCorridors,
  transferState,
  type TransferDirection,
} from "@/lib/geo/quiet-atlas";
import {
  sourceCoverage,
  sourceInventory,
  sourceTitles,
} from "@/lib/geo/source-map";
import { areaInterval, balanceMix } from "@/lib/geo/balance";
import type { Snapshot } from "@/types/electricity";
const toolNames = {
  supply: "Supply & generation split",
  demand: "Understand demand",
  forecast: "Forecast & replay",
  sources: "Explore power sources",
  costs: "Your energy tools",
  energy: "Your energy tools",
  about: "About & map display",
  connections: "International connections",
  methodology: "Sources & methodology",
  map: "Explore the map",
};
type Tool = keyof typeof toolNames;
export default function BalanceApp() {
  const { state, changeRegion, ready } = useEnergyWorkspace();
  const regionId = state.regionId;
  const [country, setCountry] = useState("France");
  const [direction, setDirection] = useState<TransferDirection>("import");
  const { grid, regional, area } = useGridData(regionId);
  const insights = useInsights();
  const [tool, setTool] = useState<Tool | null>(null),
    [replay, setReplay] = useState<Snapshot | null>(null),
    [now, setNow] = useState(() => Date.now());
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [sourceFlow, setSourceFlow] = useState(true),
    [cities, setCities] = useState(true),
    [links, setLinks] = useState(true),
    [mode, setMode] = useState<"flow" | "carbon" | "connections">("flow");
  const [allSources, setAllSources] = useState(true);
  const [clusterSites, setClusterSites] = useState<EnergyAsset[]>([]);
  const [sourceFuel, setSourceFuel] = useState<SourceFuel>("wind"),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [controls, setControls] = useState<MapControls | null>(null);
  const [mobile, setMobile] = useState<boolean | null>(null);
  const stationHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (tool === "sources" && selectedId) {
      stationHeading.current?.focus({ preventScroll: true });
      stationHeading.current?.scrollIntoView({
        block: "nearest",
        behavior: playing ? "smooth" : "instant",
      });
    }
  }, [tool, selectedId, playing]);
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
  useEffect(() => {
    const query = matchMedia("(max-width: 700px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const legacyRead = useRef(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!ready || legacyRead.current) return;
    legacyRead.current = true;
    const params = new URL(location.href).searchParams,
      t = params.get("tool"),
      r = params.get("region");
    if (t && Object.hasOwn(toolNames, t)) setTool(t as Tool);
    if (r && gridRegions.some((v) => String(v.id) === r)) changeRegion(r);
  }, [ready, changeRegion]);
  const onControls = useCallback(
    (value: MapControls | null) => setControls(value),
    [],
  );
  const selectRegion = useCallback(
    (value: string) => {
      changeRegion(value);
      setReplay(null);
      setSelectedId(null);
      setMapFocus(null);
    },
    [changeRegion],
  );
  const onRegionSelect = useCallback(
    (id: number) => selectRegion(String(id)),
    [selectRegion],
  );
  const close = useCallback(() => {
    setTool(null);
    if (location.search) history.replaceState(null, "", "/");
  }, []);
  const revealMap = useCallback(() => {
    if (mobile) {
      setTool("map");
      return;
    }
    requestAnimationFrame(() =>
      document.querySelector(".balance-map")?.scrollIntoView({
        block: "center",
        behavior: playing ? "smooth" : "instant",
      }),
    );
  }, [playing, mobile]);
  const applyReplay = useCallback(
    (value: Snapshot) => {
      setReplay(value);
      setMapFocus(null);
      close();
      revealMap();
    },
    [close, revealMap],
  );
  const latest = useCallback(() => setReplay(null), []);
  const selectAsset = useCallback((asset: EnergyAsset) => {
    const fromCluster = document.activeElement?.closest(".map-cluster-sites");
    setSourceFuel(asset.fuel as SourceFuel);
    setAllSources(false);
    setClusterSites([]);
    setSelectedId(asset.id);
    if (fromCluster)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(
            '.source-marker-target[aria-pressed="true"]',
          )
          ?.focus({ preventScroll: true }),
      );
  }, []);
  const showAllSources = () => {
    setAllSources(true);
    setSelectedId(null);
    setClusterSites([]);
    setSourceFlow(true);
    setMapFocus(null);
    setMode("flow");
  };
  const previewFuel = (fuel: string) => {
    if (fuel === "imports") {
      setMode("connections");
      setMapFocus(null);
      setSelectedId(null);
      setClusterSites([]);
      setLinks(true);
    } else if (sourceFuels.some((f) => f.key === fuel)) {
      setSourceFuel(fuel as SourceFuel);
      setAllSources(false);
      setSelectedId(null);
      setClusterSites([]);
      setSourceFlow(true);
      setMode("flow");
      setMapFocus(null);
    } else return;
    if (mobile || tool) {
      close();
      revealMap();
    }
  };
  const selectCountry = (
    value: string,
    selectedDirection: TransferDirection,
  ) => {
    if (!countryCorridors.some((c) => c.country === value)) {
      setTool("connections");
      return;
    }
    setCountry(value);
    setDirection(selectedDirection);
    setMode("connections");
    setMapFocus(null);
    setSelectedId(null);
    setClusterSites([]);
    setLinks(true);
    close();
    revealMap();
  };
  const snapshot = replay ?? grid.data;
  const generation = snapshot?.generation ?? null,
    demand = snapshot?.demand ?? null;
  const interval = replay ? null : areaInterval(area.data, regionId, now);
  const rows = useMemo(
    () => balanceMix(regionId, interval, generation),
    [regionId, interval, generation],
  );
  const regionName =
    gridRegions.find((r) => String(r.id) === regionId)?.name ?? "Great Britain";
  const regionCarbon = (
    replay ? snapshot?.regional : regional.data
  )?.regions.find((r) => String(r.id) === regionId);
  const carbon = regionId
    ? (interval?.intensity ?? regionCarbon?.intensity ?? null)
    : (snapshot?.carbon?.intensity ?? null);
  const carbonAt = regionId
    ? (interval?.from ??
      (replay ? snapshot?.regional?.from : regional.data?.from))
    : snapshot?.carbon?.from;
  const carbonQuality = regionId
    ? "forecast"
    : (snapshot?.carbon?.quality ?? "unavailable");
  const sites = useMemo(() => {
    const values = sourceInventory(allSources ? null : sourceFuel);
    const point = area.data?.point;
    return point
      ? values.toSorted(
          (a, b) => distanceKm(point, a.point) - distanceKm(point, b.point),
        )
      : values;
  }, [sourceFuel, allSources, area.data?.point]);
  const activeSite = sites.find((a) => a.id === selectedId);
  const settings = useMemo(
    () => ({
      playing,
      speed,
      wind: sourceFlow && mode === "flow",
      connections: links && mode === "connections",
      cities,
      sourceFuel,
      allSources,
      selectedId,
      country,
      direction,
      stale: !generation || generation.stale || !!grid.error,
      flows: generation?.interconnectors ?? {},
    }),
    [
      playing,
      speed,
      sourceFlow,
      mode,
      links,
      cities,
      sourceFuel,
      allSources,
      selectedId,
      country,
      direction,
      grid.error,
      generation,
    ],
  );
  const atlasTransfer = transferState(
    settings.flows,
    country,
    direction,
    settings.stale,
  );
  const regionalState = replay ? (snapshot?.regional ?? null) : regional.data;
  const delayed =
    !replay &&
    (!!grid.error ||
      !!area.error ||
      generation?.stale ||
      demand?.stale ||
      snapshot?.carbon?.stale ||
      area.data?.stale ||
      regional.data?.stale);
  const status = replay
    ? "HISTORICAL REPLAY"
    : grid.loading
      ? "CONNECTING"
      : delayed
        ? "DATA DELAYED"
        : snapshot?.errors.length
          ? "PARTIAL DATA"
          : "LATEST OBSERVATIONS";
  const legacyView =
    typeof window !== "undefined"
      ? new URL(location.href).searchParams.get("view")
      : null;
  const energyTab =
    legacyView &&
    ["tariff", "planner", "annual", "usage", "plan"].includes(legacyView)
      ? (legacyView as "tariff" | "planner" | "annual" | "usage" | "plan")
      : tool === "costs"
        ? "planner"
        : "usage";
  const mapPanel = (
    <section className="balance-map" aria-label="Regional electricity map">
      <EnergyMap
        settings={settings}
        focusPoint={mapFocus}
        onControls={onControls}
        onSelect={selectAsset}
        onCluster={(group) => {
          setClusterSites(group);
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>(".map-cluster-sites button")
              ?.focus({ preventScroll: true }),
          );
        }}
        onRegionSelect={onRegionSelect}
        selectedRegionId={regionId ? Number(regionId) : null}
        mode={mode}
        regional={regionalState}
      />
      <div className="balance-map-tools">
        <button aria-label="Zoom in" onClick={() => controls?.zoomIn()}>
          +
        </button>
        <button aria-label="Zoom out" onClick={() => controls?.zoomOut()}>
          −
        </button>
        <button
          aria-label="Reset map view"
          onClick={() => {
            setMapFocus(null);
            controls?.reset();
          }}
        >
          ⌖
        </button>
      </div>
      <div className="source-map-heading">
        <div>
          <strong>
            {mode === "connections"
              ? `${country} · international transfers`
              : mode === "carbon"
                ? "Regional carbon"
                : allSources
                  ? "Generating sites across Britain"
                  : sourceTitles[sourceFuel]}
          </strong>
          <span>
            {mode === "flow"
              ? `${sites.length} station records · GB`
              : "Select a source or country to change the map"}
          </span>
        </div>
        {(!allSources || mode !== "flow" || selectedId) && (
          <button onClick={showAllSources}>Show all sources</button>
        )}
      </div>
      <div
        className="balance-map-caption quiet-map-selection"
        aria-live="polite"
      >
        {mode === "flow" ? (
          <>
            <strong>
              {selectedId && activeSite
                ? activeSite.name
                : allSources
                  ? "Explore where power is generated"
                  : sourceTitles[sourceFuel]}
            </strong>
            <span>
              {selectedId
                ? "Individual output unavailable · location only"
                : sites.length
                  ? "Select a marker · numbered groups zoom into nearby sites"
                  : "No matching station locations in our inventory"}
            </span>
            {!!sites.length && (
              <span>{sourceCoverage(allSources ? null : sourceFuel)}</span>
            )}
            <span>
              {regionId
                ? "GB sites, not a trace of regional supply."
                : "Locations only · current station output unavailable."}
            </span>
            {!!clusterSites.length && (
              <div
                className="map-cluster-sites"
                aria-label="Stations in this group"
              >
                {clusterSites.map((site) => (
                  <button key={site.id} onClick={() => selectAsset(site)}>
                    {site.name}
                  </button>
                ))}
              </div>
            )}
            {selectedId && activeSite && (
              <button
                className="text-button"
                onClick={() => setTool("sources")}
              >
                Site details ↗
              </button>
            )}
          </>
        ) : mode === "connections" ? (
          <>
            <strong>
              {country}{" "}
              {direction === "import" ? "→ Great Britain" : "← Great Britain"}
            </strong>
            <span>
              {atlasTransfer.complete
                ? `${atlasTransfer.mw.toLocaleString("en-GB")} MW ${direction === "import" ? "imported" : "exported"}`
                : "Incomplete readings · motion off"}
              {settings.stale ? " · delayed · motion off" : ""}
              {!links ? " · corridor hidden" : ""}
            </span>
            <span>
              {atlasTransfer.group
                ? `Both directions: ${atlasTransfer.group.importsMw.toLocaleString("en-GB")} MW in · ${atlasTransfer.group.exportsMw.toLocaleString("en-GB")} MW out`
                : "No reported readings"}
            </span>
            <span>Country-level schematic · not a physical cable route</span>
            <span>
              {replay ? "Historical · " : "Observed · "}
              {generation ? localTime(generation.from) : "unavailable"}
            </span>
            <button
              className="text-button"
              onClick={() => setTool("connections")}
            >
              Reported links & timestamps ↗
            </button>
          </>
        ) : (
          <>
            <strong>Regional carbon</strong>
            <span>Select a region · modelled intensity</span>
          </>
        )}
      </div>
    </section>
  );
  return (
    <main className="balance-app">
      <InteractionEffects />
      <header className="balance-header">
        <span className="balance-brand">
          GRID <i>/</i> ALIVE
        </span>
        <label className="balance-region">
          <span className="region-control-label">Region</span>
          <select
            aria-label="Electricity region"
            disabled={!ready}
            value={regionId}
            onChange={(e) => selectRegion(e.target.value)}
          >
            <option value="">Great Britain · national overview</option>
            {gridRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <span className="balance-status">{status}</span>
        <button className="balance-about" onClick={() => setTool("about")}>
          <span className="desktop-label">About & display</span>
          <span className="mobile-label">
            More <MobileIcon name="more" />
          </span>
        </button>
      </header>
      <section className="balance-overview" aria-label="Regional overview">
        <div className="balance-location" key={"location-" + regionId}>
          <p className="eyebrow">
            <span className="desktop-label">
              THE {regionId ? "REGIONAL" : "NATIONAL"} PICTURE
            </span>
            <span className="mobile-label">
              YOUR ELECTRICITY{" "}
              <span className="mobile-live-status">
                {status === "LATEST OBSERVATIONS"
                  ? "Latest data"
                  : status.toLowerCase()}
              </span>
            </span>
          </p>
          <h1>{regionName}</h1>
          <p>
            {regionId
              ? "Modelled regional supply mix · national demand for context"
              : "Metered generation, demand and carbon, with independent timestamps"}
          </p>
        </div>
        <div className="balance-metrics" key={"metrics-" + regionId}>
          <button className="demand-primary" onClick={() => setTool("demand")}>
            <span>
              <span className="desktop-label">
                {regionId ? "Demand · GB context" : "GB demand"}
              </span>
              <span className="mobile-label">GB demand</span>
            </span>
            <strong>
              {demand ? (demand.mw / 1000).toFixed(1) : "—"} <small>GW</small>
            </strong>
            <em>{demand ? localTime(demand.from) : "Demand unavailable"}</em>
            {regionId && (
              <em className="regional-demand-note">
                Live regional MW unavailable
              </em>
            )}
          </button>
          <button className="supply-summary" onClick={() => setTool("supply")}>
            <span>{regionId ? "Regional supply mix" : "GB generation"}</span>
            <strong>
              {regionId
                ? (rows[0]?.perc.toFixed(1) ?? "—")
                : generation
                  ? (generation.totalMw / 1000).toFixed(1)
                  : "—"}{" "}
              <small>{regionId ? "%" : "GW"}</small>
            </strong>
            <em>
              {regionId
                ? rows[0]
                  ? rows[0].label + " · modelled"
                  : "Mix unavailable"
                : generation
                  ? "Metered · " + localTime(generation.from)
                  : "Generation unavailable"}
            </em>
          </button>
          <button onClick={() => setTool("forecast")}>
            <span>Carbon · {carbonQuality}</span>
            <strong>{carbon ?? "—"}</strong>
            <em>
              gCO₂/kWh
              {carbonAt ? " · " + localTime(carbonAt) : " · unavailable"}
            </em>
          </button>
        </div>
        {regionId && (
          <p className="mobile-data-note">
            Live regional demand is unavailable. Demand shown is for Great
            Britain.
          </p>
        )}
      </section>
      {(grid.error || area.error || !!snapshot?.errors.length) && (
        <p className="balance-notice" role="status">
          {grid.error || area.error || snapshot?.errors.join(" · ")}
        </p>
      )}
      {replay && (
        <div className="replay-banner" role="status">
          Historical observation · {localTime(replay.requestedAt)}
          <button onClick={latest}>Return to latest ↗</button>
        </div>
      )}
      <div className="balance-layout">
        {mobile === false && tool !== "map" && mapPanel}
        <aside className="balance-split">
          <p className="eyebrow">WHERE SUPPLY COMES FROM</p>
          <button
            className="balance-split-title"
            onClick={() => setTool("supply")}
          >
            Generation split <span>↗</span>
          </button>
          <p className="balance-split-context">
            {regionId ? (
              "Regional modelled mix, including imports and embedded generation"
            ) : (
              <>
                <span className="desktop-label">
                  GB metered generation · storage separate
                </span>
                <span className="mobile-label">
                  GB generation ·{" "}
                  {generation
                    ? (generation.totalMw / 1000).toFixed(1) + " GW"
                    : "unavailable"}{" "}
                  · metered
                </span>
              </>
            )}
          </p>
          {(regionId ? area.loading : grid.loading) ? (
            <div className="mix-loading" role="status">
              <span>Updating generation mix…</span>
              <div className="mix-loading-body" aria-hidden="true">
                <i />
                <div>
                  {Array.from({ length: 6 }, (_, i) => (
                    <b key={i} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <GenerationSplit
              compact
              rows={rows.filter((f) => f.perc > 0)}
              selectedFuel={
                mode === "connections"
                  ? "imports"
                  : mode === "flow" && !allSources
                    ? sourceFuel
                    : null
              }
              motion={playing}
              onFuelSelect={previewFuel}
              onImports={() => setTool("connections")}
              mapVisible={mobile === false && mode === "flow" && sourceFlow}
              onExploreSource={() => setTool("sources")}
            />
          )}
          <p className="balance-mix-time">
            {regionId
              ? interval
                ? "NESO · " +
                  localTime(interval.from) +
                  (area.data?.stale || area.error ? " · delayed" : "")
                : replay
                  ? "Regional mix is unavailable in this replay archive."
                  : area.loading
                    ? "Loading the selected region…"
                    : "Regional mix unavailable."
              : generation
                ? "Elexon · " +
                  localTime(generation.from) +
                  (generation.stale ? " · delayed" : "")
                : grid.loading
                  ? "Fetching latest observation…"
                  : "Generation unavailable."}
          </p>
          {!regionId && generation && !rows.some((f) => f.fuel === "solar") && (
            <p className="small">
              Solar is not separately reported in this national feed.
            </p>
          )}
          <button
            className="balance-source-link"
            onClick={() => setTool("sources")}
          >
            Browse generating sites ↗
          </button>
        </aside>
      </div>
      <CountryFlowSummary
        snapshot={snapshot}
        onOpen={() => setTool("connections")}
        onSelect={selectCountry}
        selectedCountry={mode === "connections" ? country : null}
        selectedDirection={direction}
      />
      <button
        className="mobile-map-entry"
        onClick={() => {
          setMapFocus(null);
          setTool("map");
        }}
      >
        <MobileIcon name="map" />
        <span>
          <b>Explore the electricity map</b>
          <small>Generating sites & cross-border flows</small>
        </span>
        <span aria-hidden="true">↗</span>
      </button>
      <nav className="balance-dock desktop-dock" aria-label="Energy tools">
        {(
          [
            ["demand", "Demand details"],
            ["forecast", "Next 48 hours"],
            ["costs", "Save money"],
            ["energy", "My energy"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} onClick={() => setTool(key)}>
            {label}
          </button>
        ))}
      </nav>
      <nav className="mobile-nav" aria-label="Mobile energy tools">
        <button
          aria-current={!tool ? "page" : undefined}
          onClick={() => {
            close();
            window.scrollTo({
              top: 0,
              behavior: playing ? "smooth" : "instant",
            });
          }}
        >
          <MobileIcon name="overview" />
          <span>Overview</span>
        </button>
        {(
          [
            ["demand", "Demand", "demand"],
            ["forecast", "Forecast", "forecast"],
            ["costs", "Save money", "costs"],
            ["energy", "My energy", "energy"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            aria-current={tool === id ? "page" : undefined}
            onClick={() => setTool(id)}
          >
            <MobileIcon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <footer className="balance-footer">
        <span>
          {regionId
            ? "Regional mix is modelled · live regional MW unavailable"
            : "Great Britain · independently timed observations"}{" "}
          · Quiet Atlas
        </span>
        <div>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? "Pause motion" : "Play motion"}
          </button>
          <button onClick={() => setTool("methodology")}>
            Sources & methodology
          </button>
        </div>
      </footer>
      <ToolDialog
        title={
          tool === "about" && mobile
            ? "More & settings"
            : tool
              ? toolNames[tool]
              : "Energy tools"
        }
        open={tool !== null}
        onClose={close}
      >
        <p className="tool-region-context">
          {tool === "connections"
            ? "Great Britain · international transfers"
            : regionName}
          {replay && (tool === "supply" || tool === "connections")
            ? " · historical observation"
            : ""}
        </p>
        {tool === "map" && (
          <div className="map-dialog-content">
            {mapPanel}
            <button
              className="map-settings-link"
              onClick={() => setTool("about")}
            >
              Map display & motion settings ↗
            </button>
          </div>
        )}
        {tool === "supply" && (
          <section>
            <p className="section-copy">
              {regionId
                ? "NESO's modelled regional fuel mix describes the electricity mix in the region. It does not report live generation in MW for the region or trace electricity from a specific station to a home."
                : "Elexon metered GB generation. Embedded generation is not fully covered; pumped storage and international transfers are separate."}
            </p>
            <GenerationSplit
              rows={rows}
              selectedFuel={
                mode === "connections"
                  ? "imports"
                  : mode === "flow" && !allSources
                    ? sourceFuel
                    : null
              }
              motion={playing}
              onFuelSelect={previewFuel}
              onImports={() => setTool("connections")}
              mapVisible={mobile === false && mode === "flow" && sourceFlow}
              onExploreSource={() => setTool("sources")}
            />
            <p className="small">
              {regionId
                ? interval
                  ? `NESO regional model · ${localTime(interval.from)}${area.data?.stale || area.error ? " · delayed" : ""}`
                  : "Regional mix unavailable for this period."
                : generation
                  ? `Elexon · ${localTime(generation.from)}${generation.stale || grid.error ? " · delayed" : ""}`
                  : grid.loading
                    ? "Fetching latest observation…"
                    : "Generation unavailable."}
            </p>
            {generation && !regionId && (
              <dl className="supply-facts">
                <div>
                  <dt>Metered generation</dt>
                  <dd>{(generation.totalMw / 1000).toFixed(1)} GW</dd>
                </div>
                <div>
                  <dt>
                    {generation.netImportsMw < 0
                      ? "Net exports"
                      : "Net imports"}
                  </dt>
                  <dd>
                    {(Math.abs(generation.netImportsMw) / 1000).toFixed(1)} GW
                  </dd>
                </div>
                <div>
                  <dt>Pumped storage</dt>
                  <dd>{(generation.storageMw / 1000).toFixed(1)} GW</dd>
                </div>
              </dl>
            )}
            <div className="tool-actions">
              <button
                className="text-button"
                onClick={() => setTool("sources")}
              >
                Explore named generating sites ↗
              </button>
              <button
                className="text-button"
                onClick={() => setTool("connections")}
              >
                International connections ↗
              </button>
            </div>
          </section>
        )}
        {tool === "demand" && (
          <DemandTools
            data={insights.data}
            error={insights.error}
            regionName={regionName}
          />
        )}
        {tool === "forecast" && (
          <ForecastTools
            area={area.data}
            areaError={area.error}
            data={insights.data}
            error={insights.error}
            onFrame={applyReplay}
            onNow={latest}
          />
        )}
        {(tool === "costs" || tool === "energy") && (
          <EnergyTools
            key={tool}
            initialTab={energyTab}
            forecast={{
              area: area.data,
              national: insights.data?.carbonForecast ?? [],
              regionalLoading: area.loading,
              regionalError: area.error,
              error: insights.error,
            }}
          />
        )}
        {tool === "connections" && (
          <Connections
            snapshot={snapshot}
            onMap={() => {
              setMode("connections");
              setMapFocus(null);
              setLinks(true);
              close();
              revealMap();
            }}
          />
        )}
        {tool === "methodology" && <Methodology />}
        {tool === "sources" && (
          <section>
            <p className="section-copy">
              Dated GB station locations, not live station output. Gas, nuclear
              and oil cover major power producers in the May 2026 DUKES
              register; renewables are featured REPD sites from July 2026.
              Coordinates are approximate source reference points.
            </p>
            <div
              className="source-directory-filters"
              aria-label="Filter station directory"
            >
              <button aria-pressed={allSources} onClick={showAllSources}>
                All sources
              </button>
              {sourceFuels
                .filter((f) => energyAssets.some((a) => a.fuel === f.key))
                .map((f) => (
                  <button
                    key={f.key}
                    aria-pressed={!allSources && sourceFuel === f.key}
                    onClick={() => {
                      setSourceFuel(f.key);
                      setAllSources(false);
                      setSelectedId(null);
                      setClusterSites([]);
                      setMapFocus(null);
                      setMode("flow");
                    }}
                  >
                    {f.label}
                  </button>
                ))}
            </div>
            <p className="small">
              {sites.length} locations ·{" "}
              {sourceCoverage(allSources ? null : sourceFuel)}
            </p>
            {activeSite && (
              <>
                <h2 ref={stationHeading} tabIndex={-1}>
                  {activeSite.name}
                </h2>
                <dl className="supply-facts">
                  <div>
                    <dt>Installed capacity</dt>
                    <dd>{activeSite.capacityMw.toLocaleString("en-GB")} MW</dd>
                  </div>
                  <div>
                    <dt>Measured output</dt>
                    <dd>Unavailable</dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd>
                      {activeSite.country} ·{" "}
                      {activeSite.snapshot ?? "July 2026"}
                    </dd>
                  </div>
                  {activeSite.turbines !== null && (
                    <div>
                      <dt>Recorded turbines</dt>
                      <dd>{activeSite.turbines}</dd>
                    </div>
                  )}
                </dl>
                <p className="small">
                  {activeSite.status}. {activeSite.source}. Capacity and status
                  are dated metadata. Rotor motion does not establish current
                  site output.
                </p>
                <button
                  className="action-button"
                  onClick={() => {
                    setAllSources(false);
                    setSelectedId(activeSite.id);
                    setMapFocus(activeSite.point);
                    setMode("flow");
                    setSourceFlow(true);
                    close();
                    revealMap();
                  }}
                >
                  Show site on map ↗
                </button>
              </>
            )}
            <ul
              className="source-directory-list"
              aria-label="Generating site directory"
            >
              {sites.map((site) => (
                <li key={site.id}>
                  <button
                    aria-pressed={selectedId === site.id}
                    onClick={() => selectAsset(site)}
                  >
                    <span>
                      {site.name}
                      <small>
                        {site.country} · {site.fuel}
                      </small>
                    </span>
                    <span>
                      {site.capacityMw.toLocaleString("en-GB")} MW
                      <small>Installed capacity</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {tool === "about" && (
          <>
            <div className="mobile-more-menu">
              {(
                [
                  ["map", "Explore map", "map"],
                  ["sources", "Power sources", "overview"],
                  ["connections", "Country transfers", "demand"],
                  ["energy", "My energy & saved plans", "energy"],
                  ["methodology", "Sources & methodology", "more"],
                ] as const
              ).map(([id, label, icon]) => (
                <button key={id} onClick={() => setTool(id)}>
                  <MobileIcon name={icon} />
                  <span>{label}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <section className="display-settings">
              <h2>Map display</h2>
              <div className="field-grid">
                <div
                  className="source-directory-filters"
                  aria-label="Map display"
                >
                  <button
                    onClick={showAllSources}
                    aria-pressed={mode === "flow"}
                  >
                    Source locations
                  </button>
                  <button
                    onClick={() => {
                      setMode("carbon");
                      setMapFocus(null);
                    }}
                    aria-pressed={mode === "carbon"}
                  >
                    Regional carbon
                  </button>
                  <button
                    onClick={() => {
                      setMode("connections");
                      setMapFocus(null);
                      setLinks(true);
                    }}
                    aria-pressed={mode === "connections"}
                  >
                    International transfers
                  </button>
                </div>
                <label>
                  Animation speed
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value={0.5}>Slow · 0.5×</option>
                    <option value={1}>Normal · 1×</option>
                    <option value={2}>Fast · 2×</option>
                  </select>
                </label>
              </div>
              <div className="display-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={cities}
                    onChange={(e) => setCities(e.target.checked)}
                  />{" "}
                  City lights
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={sourceFlow}
                    onChange={(e) => setSourceFlow(e.target.checked)}
                  />{" "}
                  Source symbols
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={links}
                    onChange={(e) => setLinks(e.target.checked)}
                  />{" "}
                  Reported international connections
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={playing}
                    onChange={(e) => setPlaying(e.target.checked)}
                  />{" "}
                  Animate
                </label>
              </div>
              <button
                className="text-button"
                onClick={() => setTool("connections")}
              >
                View reported international transfers ↗
              </button>
            </section>
            <GridHeartbeat data={insights.data} />
            <button
              className="text-button"
              onClick={() => setTool("methodology")}
            >
              Read sources, definitions & privacy ↗
            </button>
          </>
        )}
      </ToolDialog>
    </main>
  );
}
