"use client";
import { useEffect, useMemo, useState } from "react";
import {
  type Tariff,
  type CarbonRate,
  type TaskWindow,
  taskWindows,
  cheapest,
  cleanest,
  money,
} from "@/lib/home/energy";
import { useEnergyWorkspace } from "./energy-workspace";
import { gridRegions } from "@/lib/geo/regions";
import { RegionSelect } from "./region-select";
import { NumberChoice } from "./number-choice";
import { useInsights } from "./britain-insights";
import { SeriesChart, localTime } from "./series-chart";
import type { AreaData } from "@/types/area";
export function TaskPlanner({
  tariff,
  onTariff,
  onPlan,
}: {
  tariff: Tariff | null;
  onTariff: () => void;
  onPlan?: (window: TaskWindow, kind: "price" | "carbon") => void;
}) {
  const { state, setState, changeRegion } = useEnergyWorkspace();
  const regionId = state.regionId,
    setRegionId = changeRegion;
  const { data, error } = useInsights();
  const { task, kwh, hours, deadline } = state.taskDraft;
  const updateDraft = (patch: Partial<typeof state.taskDraft>) =>
    setState((s) => ({ ...s, taskDraft: { ...s.taskDraft, ...patch } }));
  const setKwh = (value: string) => updateDraft({ kwh: value }),
    setHours = (value: string) => updateDraft({ hours: value });
  const [area, setArea] = useState<AreaData | null>(null),
    [regionError, setRegionError] = useState(""),
    [regionBusy, setBusy] = useState(false),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refreshClock = () => {
      if (!document.hidden) setNow(Date.now());
    };
    const timer = setInterval(refreshClock, 60000);
    document.addEventListener("visibilitychange", refreshClock);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshClock);
    };
  }, []);
  const carbon: CarbonRate[] = useMemo(
    () =>
      area
        ? area.intervals
            .filter((r) => r.intensity !== null)
            .map((r) => ({ from: r.from, to: r.to, intensity: r.intensity! }))
        : (data?.carbonForecast ?? []).map((p) => ({
            from: p.at,
            to: new Date(Date.parse(p.at) + 1800000).toISOString(),
            intensity: p.value,
          })),
    [area, data],
  );
  const windows = useMemo(
    () =>
      taskWindows(
        tariff,
        Number(kwh),
        Number(hours),
        carbon,
        now,
        now + Number(deadline) * 3600000,
      ),
    [tariff, kwh, hours, carbon, now, deadline],
  );
  const best = cheapest(windows),
    green = cleanest(windows),
    baseline = windows[0];
  const saving =
    baseline?.cost !== null &&
    baseline?.cost !== undefined &&
    best?.cost !== null &&
    best?.cost !== undefined
      ? baseline.cost - best.cost
      : null;
  useEffect(() => {
    setArea(null);
    setRegionError("");
    if (!regionId) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    fetch("/api/area?region=" + encodeURIComponent(regionId), {
      signal: controller.signal,
    })
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw Error(v.error);
        if (v.stale)
          throw Error("Regional data is delayed. National forecast retained.");
        if (!controller.signal.aborted) setArea(v);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setRegionError(e instanceof Error ? e.message : "Region unavailable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [regionId]);
  function preset(value: string) {
    const values: Record<string, [string, string]> = {
      Laundry: ["1", "1.5"],
      Dishwasher: ["1.5", "2"],
      "EV charging": ["14", "4"],
      "Custom task": ["2", "1"],
    };
    const [k, h] = values[value];
    updateDraft({ task: value as typeof task, kwh: k, hours: h });
  }
  const windowBlock = (
    title: string,
    w: TaskWindow | null | undefined,
    kind: string,
  ) => (
    <article className={`window-result ${kind}`}>
      <p className="eyebrow">{title}</p>
      {w ? (
        <>
          <h3>
            {(kind === "green" || !tariff) && w.carbon !== null
              ? `${Math.round(w.carbon)} gCO₂`
              : w.cost === null
                ? "Cost unknown"
                : money(w.cost)}
          </h3>
          <p>
            {localTime(w.from)}
            <br />→ {localTime(w.to)}
          </p>
          <span>
            {kind === "green" || !tariff
              ? w.cost === null
                ? "Household cost unknown"
                : `${money(w.cost)} estimated task cost`
              : w.carbon === null
                ? "Carbon forecast unavailable"
                : `${Math.round(w.carbon)} gCO₂ estimated for task`}
          </span>
          {onPlan && (kind === "best" || kind === "green") && (
            <button
              className="text-button"
              onClick={() =>
                onPlan(
                  {
                    ...w,
                    assumptions: `${task} · ${kwh} kWh over ${hours} hours · ${tariff?.name ?? "tariff not selected"}`,
                  },
                  kind === "best" ? "price" : "carbon",
                )
              }
            >
              Use this window in my plan ↗
            </button>
          )}
        </>
      ) : (
        <p>No complete published window available.</p>
      )}
    </article>
  );
  return (
    <section>
      <div className="section-heading">
        <p className="eyebrow">A USEFUL TIME TO USE ENERGY</p>
        <h2>Plan a flexible task</h2>
        <p className="section-copy">
          Compare household cost and forecast carbon. The cheapest and
          lowest-carbon windows can be different.
        </p>
      </div>
      {!tariff && (
        <div className="carbon-only-notice">
          <p>
            Choose a task to explore its forecast carbon footprint. Household
            cost stays unknown until you select a supported tariff.
          </p>
          <button className="text-button" onClick={onTariff}>
            Choose my supplier and tariff ↗
          </button>
        </div>
      )}
      <>
        <p className="active-rate-line">
          {tariff?.name ?? "Carbon planning · no household tariff selected"} ·
          standing charge excluded from task comparisons
        </p>
        {tariff?.regionId && regionId && tariff.regionId !== regionId && (
          <p className="small" role="status">
            The carbon forecast uses your selected region. Household prices
            remain tied to{" "}
            {gridRegions.find((r) => String(r.id) === tariff.regionId)?.name ??
              "your tariff region"}
            ; exploring another region does not change your tariff.
          </p>
        )}
        <div className="planner-controls field-grid">
          <label>
            Task
            <select value={task} onChange={(e) => preset(e.target.value)}>
              {["Custom task", "Laundry", "Dishwasher", "EV charging"].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </label>
          <NumberChoice
            id="task-energy"
            label="Energy · kWh"
            value={kwh}
            onChange={setKwh}
            values={[0.5, 1, 1.5, 2, 3, 5, 7, 10, 14, 20, 30, 50, 100, 200]}
            unit="kWh"
            min={0.01}
            max={200}
          />
          <NumberChoice
            id="task-duration"
            label="Duration · hours"
            value={hours}
            onChange={setHours}
            values={[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 24]}
            unit="hours"
            min={0.5}
            max={24}
            step={0.5}
          />
          <label>
            Finish within
            <select
              value={deadline}
              onChange={(e) =>
                updateDraft({ deadline: e.target.value as typeof deadline })
              }
            >
              {[6, 12, 24, 48].map((v) => (
                <option key={v} value={v}>
                  {v} hours
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="small">
          Preset amounts are editable examples, not measured appliance
          consumption. Assumes constant power across the task and half-hour
          start times.
        </p>
        <button className="text-button" onClick={() => setNow(Date.now())}>
          Refresh planning time ↻
        </button>
        <div className={`window-results ${!tariff ? "carbon-only" : ""}`}>
          {windowBlock("NEXT HALF-HOUR START", baseline, "baseline")}
          {tariff && windowBlock("LOWEST HOUSEHOLD COST", best, "best")}
          {windowBlock("LOWEST FORECAST CARBON", green, "green")}
        </div>
        {saving !== null ? (
          <div className="saving-statement">
            <b>{money(Math.max(0, saving))}</b>
            <span>
              estimated saving per task versus the next half-hour start.
              {tariff?.kind === "single"
                ? " Moving the same usage on a single-rate tariff saves £0 in unit charges."
                : " Based only on your tariff’s covered intervals."}
            </span>
          </div>
        ) : (
          <p className="small">
            A saving cannot be calculated without a price for the baseline and
            the selected window.
          </p>
        )}
        {!windows.length && (
          <p className="form-message">
            Enter valid energy and duration values, and allow enough time for
            the task to finish.
          </p>
        )}
        {tariff ? (
          <SeriesChart
            unit="p/kWh · average task rate"
            maxGapMinutes={35}
            series={[
              {
                label: "Covered start windows",
                color: "#7ad9cb",
                points: windows
                  .filter((w) => w.cost !== null)
                  .map((w) => ({ at: w.from, value: w.cost! / Number(kwh) })),
              },
            ]}
          />
        ) : (
          <SeriesChart
            unit="gCO₂ per task · forecast"
            maxGapMinutes={35}
            series={[
              {
                label: "Carbon by task start time",
                color: "#7ad9be",
                points: windows
                  .filter((w) => w.carbon !== null)
                  .map((w) => ({ at: w.from, value: w.carbon! })),
              },
            ]}
          />
        )}
        <details className="planner-details">
          <summary>Compare all task start windows</summary>
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Start · Europe/London</th>
                  <th>Energy cost</th>
                  <th>Task CO₂ forecast</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w) => (
                  <tr key={w.from}>
                    <th>{localTime(w.from)}</th>
                    <td>{w.cost === null ? "Unpublished" : money(w.cost)}</td>
                    <td>
                      {w.carbon === null
                        ? "Unavailable"
                        : `${Math.round(w.carbon)} g`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </>
      <div className="regional-choice">
        <RegionSelect
          id="planner-region"
          label="Carbon forecast area"
          value={regionId}
          onChange={setRegionId}
          national
        />
        {regionBusy && (
          <p className="small" role="status">
            Loading regional forecast…
          </p>
        )}
        <p className="small">
          {area
            ? `Using ${area.name} regional forecast.`
            : "Using the Great Britain forecast."}{" "}
          No address or postcode is needed.
        </p>
      </div>
      {regionError && (
        <p role="alert" className="form-message">
          {regionError}
        </p>
      )}
      {error && (
        <p className="small" role="status">
          {error}
        </p>
      )}
      <p className="small">
        Rates and forecasts may change. Future unpublished prices are unknown.
        Planning does not switch or control appliances.
      </p>
    </section>
  );
}
