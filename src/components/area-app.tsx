"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RegionSelect } from "./region-select";
import { Workspace } from "./product-nav";
import { EnergyMap, type MapControls } from "./map/energy-map";
import { energyAssets, type EnergyAsset } from "@/lib/geo/assets";
import { distanceKm } from "@/lib/geo/distance";
import type { AreaData } from "@/types/area";
import type { Regional } from "@/types/electricity";
import annual from "../../data/annual-consumption.json";
import { SeriesChart, localTime } from "./series-chart";
const colors: Record<string, string> = {
  wind: "#76cfc4",
  solar: "#e3c578",
  gas: "#ad8dba",
  nuclear: "#b6bacd",
  imports: "#7593ae",
  hydro: "#70b6d7",
  biomass: "#a7bb85",
  coal: "#78828c",
  other: "#8ba19c",
};
export default function AreaApp() {
  const [regionId, setRegionId] = useState(""),
    [area, setArea] = useState<AreaData | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [authority, setAuthority] = useState(""),
    [regional, setRegional] = useState<Regional | null>(null),
    [asset, setAsset] = useState<EnergyAsset | null>(null),
    [controls, setControls] = useState<MapControls | null>(null),
    [motion, setMotion] = useState(false),
    [layer, setLayer] = useState<"mix" | "carbon">("carbon");
  const onControls = useCallback((v: MapControls) => setControls(v), []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/regional", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setRegional)
      .catch(() => {});
    return () => c.abort();
  }, []);
  useEffect(() => {
    if (area?.point && controls) controls.focus(area.point);
  }, [area, controls]);
  const settings = useMemo(
    () => ({
      playing: motion,
      speed: 1,
      wind: true,
      cities: true,
      connections: false,
      windActivity: 0,
      flows: {},
    }),
    [motion],
  );
  const period =
    area?.intervals.find(
      (r) => Date.parse(r.from) <= Date.now() && Date.parse(r.to) > Date.now(),
    ) ?? area?.intervals[0];
  const nearby = useMemo(
    () =>
      area?.point
        ? energyAssets
            .map((a) => ({ asset: a, km: distanceKm(area.point!, a.point) }))
            .sort((a, b) => a.km - b.km)
            .slice(0, 5)
        : [],
    [area],
  );
  const local = annual.find((a) => a.code === authority);
  async function explore(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setArea(null);
    setAsset(null);
    setAuthority("");
    try {
      const r = await fetch("/api/area?region=" + encodeURIComponent(regionId));
      const value = await r.json();
      if (!r.ok) throw Error(value.error);
      setArea(value);
      const matches = annual.filter((a) => value.authorities.includes(a.name));
      if (matches.length === 1) setAuthority(matches[0].code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup unavailable");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Workspace
      active="area"
      title="Understand your area"
      intro="A regional view of your electricity mix, the generation nearby and how your community uses energy."
    >
      <form className="postcode-form selection-location" onSubmit={explore}>
        <div>
          <RegionSelect
            id="area-region"
            value={regionId}
            onChange={setRegionId}
            disabled={loading}
          />
          <button className="action-button" disabled={loading || !regionId}>
            {loading ? "Exploring…" : "Explore your region ↗"}
          </button>
        </div>
        <p>
          Choose a broad electricity region. No address or postcode is needed.
          Regional boundaries are approximate and do not identify your home's
          direct power supply.
        </p>
      </form>
      {error && (
        <p className="form-message" role="alert">
          {error}
        </p>
      )}
      <section className="area-stage" aria-label="Regional energy map">
        <EnergyMap
          settings={settings}
          onControls={onControls}
          onSelect={setAsset}
          mode={layer === "carbon" ? "carbon" : "flow"}
          regional={regional}
        />
        <div className="area-scrim" />
        <div className="area-mix">
          <p className="eyebrow">YOUR REGION · MODELLED MIX</p>
          <h2>{area?.name ?? "Britain, closer to home"}</h2>
          {period ? (
            <>
              <p className="small">
                NESO · {localTime(period.from)}
                {area?.stale ? " · delayed" : ""}
              </p>
              <ul>
                {period.mix
                  .filter((f) => f.perc > 0)
                  .sort((a, b) => b.perc - a.perc)
                  .map((f) => (
                    <li key={f.fuel}>
                      <span>{f.fuel}</span>
                      <div className="fuel-track">
                        <i
                          style={{
                            width: `${f.perc}%`,
                            background: colors[f.fuel] ?? "#9ab8be",
                          }}
                        />
                      </div>
                      <b>{f.perc.toFixed(1)}%</b>
                    </li>
                  ))}
              </ul>
              <div className="area-carbon">
                {period.intensity ?? "—"}
                <small> gCO₂/kWh</small>
              </div>
              <p className="small">
                Regional forecast · {area?.dno}. Modelled mix includes imports
                and embedded generation.
              </p>
            </>
          ) : (
            <p>
              Choose a region above to see forecasts and featured sites. The map
              shows approximate DNO carbon regions.
            </p>
          )}
        </div>
        <div className="area-map-controls">
          <button onClick={() => controls?.zoomIn()} aria-label="Zoom in">
            +
          </button>
          <button onClick={() => controls?.zoomOut()} aria-label="Zoom out">
            −
          </button>
          <button onClick={() => controls?.reset()}>Reset</button>
          <button onClick={() => setMotion(!motion)} aria-pressed={motion}>
            {motion ? "Pause motion" : "Play motion"}
          </button>
        </div>
        <div className="area-layer tab-strip">
          <button
            aria-pressed={layer === "mix"}
            onClick={() => setLayer("mix")}
          >
            Sites
          </button>
          <button
            aria-pressed={layer === "carbon"}
            onClick={() => setLayer("carbon")}
          >
            Carbon
          </button>
        </div>
        {asset && (
          <section className="area-asset">
            <button
              className="close"
              onClick={() => setAsset(null)}
              aria-label="Close site details"
            >
              ×
            </button>
            <p className="eyebrow">{asset.technology}</p>
            <h3>{asset.name}</h3>
            <dl>
              <div>
                <dt>Installed capacity</dt>
                <dd>{asset.capacityMw.toLocaleString()} MW</dd>
              </div>
              <div>
                <dt>Measured output</dt>
                <dd>Not available</dd>
              </div>
            </dl>
            <p>
              REPD July 2026 · selected site inventory. Nearby sites do not
              imply a direct supply connection.
            </p>
          </section>
        )}
        <p className="area-map-note">
          Approximate DNO boundaries · site symbols & city illumination are
          illustrative
        </p>
      </section>
      {area?.warnings.map((w) => (
        <p key={w} className="small" role="status">
          {w}
        </p>
      ))}
      <div className="area-analysis">
        <section>
          <div className="section-heading">
            <p className="eyebrow">THE NEXT 48 HOURS</p>
            <h2>How clean could your region be?</h2>
          </div>
          {area ? (
            <>
              <SeriesChart
                unit="gCO₂/kWh"
                maxGapMinutes={35}
                series={[
                  {
                    label: `${area.name} · NESO carbon`,
                    color: "#7fd6ca",
                    dashed: true,
                    points: area.intervals
                      .filter((r) => r.intensity !== null)
                      .map((r) => ({ at: r.from, value: r.intensity! })),
                  },
                ]}
              />
              <p className="small">
                Forecasts can change. Lower-carbon electricity does not
                necessarily cost less on your tariff.
              </p>
              <a className="text-link" href="/home">
                Compare useful task windows ↗
              </a>
            </>
          ) : (
            <p className="empty-state">
              Choose a region to see its published regional forecast.
            </p>
          )}
        </section>
        <section className="nearby-sites">
          <p className="eyebrow">GENERATION AROUND THE REGION</p>
          <h2>Explore the landscape</h2>
          {nearby.length ? (
            <>
              <p className="small">
                Nearest among our {energyAssets.length} selected renewable
                projects, from the outward-code centre; not a complete
                inventory.
              </p>
              {nearby.map(({ asset: a, km }) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAsset(a);
                    controls?.focus(a.point);
                    document.querySelector(".area-stage")?.scrollIntoView({
                      behavior: motion ? "smooth" : "instant",
                      block: "center",
                    });
                  }}
                >
                  <span>
                    {a.name}
                    <small>
                      {a.technology} · {a.capacityMw.toLocaleString()} MW
                      installed
                    </small>
                  </span>
                  <b>{Math.round(km)} km ↗</b>
                </button>
              ))}
            </>
          ) : (
            <p className="empty-state">
              Featured sites appear after choosing a region.
            </p>
          )}
        </section>
      </div>
      <section className="annual-section">
        <p className="eyebrow">ANNUAL LOCAL CONSUMPTION · DESNZ 2024</p>
        <h2>Where local electricity is used</h2>
        <p>
          Homes and non-domestic premises, including businesses and public
          services. These are annual metered-consumption estimates, not live
          sector demand.
        </p>
        <label htmlFor="authority">
          Choose a local authority
          {area?.authorities.length
            ? ` · postcode covers: ${area.authorities.join(", ")}`
            : ""}
        </label>
        <select
          id="authority"
          value={authority}
          onChange={(e) => setAuthority(e.target.value)}
        >
          <option value="">Select your authority</option>
          {[...annual]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <option key={a.code} value={a.code}>
                {a.name}
              </option>
            ))}
        </select>
        {local ? (
          <div className="annual-detail">
            <div>
              <h3>{local.name}</h3>
              <p className="annual-total">
                {local.totalGwh.toLocaleString("en-GB", {
                  maximumFractionDigits: 0,
                })}{" "}
                <small>GWh in {local.year}</small>
              </p>
              <div className="annual-bar">
                <span
                  style={{
                    width: `${(100 * local.domesticGwh) / local.totalGwh}%`,
                  }}
                />
                <span />
              </div>
              <dl>
                <div>
                  <dt>Homes</dt>
                  <dd>
                    {local.domesticGwh.toFixed(0)} GWh ·{" "}
                    {((100 * local.domesticGwh) / local.totalGwh).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt>Non-domestic</dt>
                  <dd>
                    {local.nonDomesticGwh.toFixed(0)} GWh ·{" "}
                    {((100 * local.nonDomesticGwh) / local.totalGwh).toFixed(1)}
                    %
                  </dd>
                </div>
              </dl>
            </div>
            <div className="annual-explanation">
              <p className="eyebrow">WHAT THIS TELLS YOU</p>
              <p>
                Average domestic use per meter:{" "}
                <b>
                  {local.meanDomesticKwh.toLocaleString("en-GB", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  kWh/year
                </b>
                .
              </p>
              <p>
                Local industry and services can shape the split. This average is
                context, not a target for your home. Postal districts, local
                authorities and grid regions have different boundaries.
              </p>
            </div>
          </div>
        ) : (
          <p className="empty-state">
            Choose an authority to reveal its annual consumption split.
          </p>
        )}
        <a
          className="text-link"
          href="https://www.gov.uk/government/statistical-data-sets/stacked-electricity-consumption-statistics-data"
          target="_blank"
          rel="noreferrer"
        >
          DESNZ annual source ↗
        </a>
      </section>
    </Workspace>
  );
}
