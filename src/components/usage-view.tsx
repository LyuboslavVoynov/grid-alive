"use client";
import { useMemo, useState } from "react";
import {
  type Reading,
  parseReadings,
  dailyGroups,
  selectPeriod,
  summarize,
  dayKey,
  dayBounds,
} from "@/lib/home/usage";
import {
  type Tariff,
  tariffRates,
  weightedValue,
  money,
} from "@/lib/home/energy";
import { SeriesChart, localTime } from "./series-chart";
export function UsageView({
  readings,
  onReadings,
  tariff,
  onTariff,
}: {
  readings: Reading[];
  onReadings: (r: Reading[]) => void;
  tariff: Tariff | null;
  onTariff: () => void;
}) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [ending, setEnding] = useState(""),
    [days, setDays] = useState(1),
    [busy, setBusy] = useState(false);
  const dates = dailyGroups(readings),
    lastComplete = [...dates]
      .reverse()
      .find(
        (d) => summarize(selectPeriod(readings, d, 1), null).completeDays === 1,
      ),
    end = ending || lastComplete || dates.at(-1) || "";
  const selected = useMemo(
      () => (end ? selectPeriod(readings, end, days) : []),
      [readings, end, days],
    ),
    summary = useMemo(() => summarize(selected, tariff), [selected, tariff]);
  const previous = useMemo(() => {
    if (!end) return [];
    const [start] = dayBounds(end);
    const previousEnd = dayKey(start - days * 86400000 + 3 * 3600000);
    return selectPeriod(readings, previousEnd, days);
  }, [readings, end, days]);
  const prior = summarize(previous, tariff),
    delta =
      summary.completeDays === days &&
      prior.completeDays === days &&
      prior.kwh > 0
        ? ((summary.kwh - prior.kwh) / prior.kwh) * 100
        : null;
  const prices =
    tariff && selected.length
      ? tariffRates(
          tariff,
          Date.parse(selected[0].from),
          Date.parse(selected.at(-1)!.to),
        ).map((r) => ({ ...r, value: r.pence }))
      : [];
  const chartPoints = selected.map((r) => ({ at: r.from, value: r.kwh }));
  const costPoints = selected.flatMap((r) => {
    const v = weightedValue(
      Date.parse(r.from),
      Date.parse(r.to),
      r.kwh,
      prices,
    );
    return v === null ? [] : [{ at: r.from, value: v / 100 }];
  });
  async function load(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (file.size > 2_000_000) throw Error("Use a CSV smaller than 2 MB.");
      const value = parseReadings(await file.text());
      onReadings(value);
      setEnding("");
      setMessage(
        `Imported ${value.length.toLocaleString()} half-hour readings. Your previous file was replaced. Nothing was uploaded.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import file");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="usage-intro">
        <div>
          <p className="eyebrow">YOUR ELECTRICITY, OVER TIME</p>
          <h2>Understand your own usage</h2>
          <p className="section-copy">
            Import half-hour electricity readings to see consumption, estimated
            costs and your overnight baseline. Files stay in this browser.
          </p>
        </div>
        <div className="import-controls">
          <label className="action-button import-button">
            {busy ? "Reading file…" : "↥ Import consumption CSV"}
            <input
              aria-label="Import consumption CSV"
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => {
                void load(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <a
            download="grid-alive-consumption-template.csv"
            href="data:text/csv;charset=utf-8,interval_start%2Cinterval_end%2Cconsumption%0A"
            className="text-link"
          >
            Download empty CSV template ↓
          </a>
        </div>
      </div>
      <details className="import-guide">
        <summary>How to prepare your readings</summary>
        <p>
          Download half-hour import consumption from your supplier. Accepted
          headers: interval_start, interval_end, consumption; or Interval Start,
          Interval End, Consumption (kWh). Use ISO timestamps with Z or UTC
          offsets, e.g. 2026-11-10T00:00:00Z. Each row must cover 30 minutes and
          contain interval energy in kWh, not cumulative meter readings or
          watts.
        </p>
        <p>
          Gaps are allowed and shown as incomplete. Duplicates, overlaps,
          negative import readings and future readings are rejected. Limit: 2 MB
          / 35,040 readings. Importing replaces the previous file. Meter totals
          cannot identify individual appliances.
        </p>
      </details>
      {error && (
        <p className="form-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {!readings.length ? (
        <div className="empty-panel">
          <h3>Your story starts with your readings</h3>
          <p>
            No personal consumption has been loaded. Import a file to see real
            patterns rather than sample household numbers.
          </p>
        </div>
      ) : (
        <>
          <div className="usage-period">
            <label>
              Period ends
              <select value={end} onChange={(e) => setEnding(e.target.value)}>
                {[...dates].reverse().map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <div className="tab-strip">
              <button aria-pressed={days === 1} onClick={() => setDays(1)}>
                One day
              </button>
              <button aria-pressed={days === 7} onClick={() => setDays(7)}>
                Seven days
              </button>
            </div>
            <span>
              {summary.completeDays}/{days} complete days · {summary.total}{" "}
              readings
            </span>
          </div>
          <div className="usage-numbers">
            <div>
              <span>Electricity used</span>
              <b>
                {summary.kwh.toFixed(2)} <small>kWh</small>
              </b>
              <p>
                {delta === null
                  ? "Comparable complete period unavailable"
                  : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs preceding ${days === 1 ? "day" : "seven days"}`}
              </p>
            </div>
            <div>
              <span>Estimated energy cost</span>
              <b>
                {summary.energyPence === null
                  ? "—"
                  : money(summary.energyPence)}
              </b>
              <p>
                {tariff
                  ? `${summary.covered}/${summary.total} intervals have a rate`
                  : "Add a tariff to estimate costs"}
              </p>
            </div>
            <div>
              <span>Standing charge, separate</span>
              <b>
                {summary.standingPence === null
                  ? "—"
                  : money(summary.standingPence)}
              </b>
              <p>
                {summary.days} calendar days represented · current daily charge
              </p>
            </div>
          </div>
          {summary.completeDays !== days && (
            <p className="coverage-note">
              This period has missing readings. Totals cover imported intervals
              only; complete-day comparisons are unavailable.
            </p>
          )}
          {!tariff && (
            <button className="text-button" onClick={onTariff}>
              Set my tariff to see costs ↗
            </button>
          )}
          <div className="usage-charts">
            <h3>Consumption through the {days === 1 ? "day" : "week"}</h3>
            <div
              className="consumption-bars"
              role="img"
              aria-label="Half-hour consumption bars; exact values are available below"
            >
              <svg viewBox="0 0 1000 190">
                <line x1="30" x2="980" y1="158" y2="158" stroke="#45616a" />
                {selected.map((r, i) => {
                  const a = selected.length ? Date.parse(selected[0].from) : 0,
                    b = selected.length ? Date.parse(selected.at(-1)!.to) : 1;
                  const x = 30 + ((Date.parse(r.from) - a) / (b - a)) * 950,
                    width = 950 / Math.max(1, (b - a) / 1800000);
                  const max = Math.max(...selected.map((r) => r.kwh), 0.1);
                  return (
                    <rect
                      key={r.from}
                      x={x}
                      y={158 - (r.kwh / max) * 135}
                      width={Math.max(1, width - 1)}
                      height={(r.kwh / max) * 135}
                      fill="#62b7af"
                    >
                      <title>
                        {localTime(r.from)} · {r.kwh} kWh
                      </title>
                    </rect>
                  );
                })}
                <text x="30" y="182">
                  {selected[0] ? localTime(selected[0].from) : ""}
                </text>
                <text x="980" y="182" textAnchor="end">
                  {selected.at(-1) ? localTime(selected.at(-1)!.to) : ""}
                </text>
              </svg>
            </div>
            <details className="data-table">
              <summary>Read consumption values · kWh</summary>
              <div>
                <table>
                  <tbody>
                    {chartPoints.map((p) => (
                      <tr key={p.at}>
                        <th>{localTime(p.at)}</th>
                        <td>{p.value.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <h3>Estimated energy cost per half-hour</h3>
            <SeriesChart
              unit="£ per interval · standing charge excluded"
              maxGapMinutes={35}
              series={[
                {
                  label: "Energy cost · your tariff",
                  color: "#dfbc78",
                  points: costPoints,
                },
              ]}
            />
          </div>
          <div className="usage-observations">
            <section>
              <p className="eyebrow">OVERNIGHT BASELINE</p>
              <h3>
                {summary.baselineKw === null
                  ? "More night readings needed"
                  : `${(summary.baselineKw * 1000).toFixed(0)} W median overnight load`}
              </h3>
              <p>
                {summary.baselineKw === null
                  ? "Import at least six half-hour readings between midnight and 05:00 to calculate an indicative baseline."
                  : "Based on imported intervals from 00:00 to 05:00. This can help you investigate background consumption; it does not identify appliances or establish avoidable waste."}
              </p>
            </section>
            <section>
              <p className="eyebrow">COST COVERAGE</p>
              <h3>
                {tariff
                  ? summary.energyPence === null
                    ? "Some prices are missing"
                    : "Your usage, priced at your rates"
                  : "Your tariff adds the context"}
              </h3>
              <p>
                {tariff
                  ? "Estimates use the selected tariff, not necessarily the tariff you held at the reading date. Published rate imports cover only available intervals; historical standing-charge changes, discounts and adjustments are excluded."
                  : "A rate alone does not tell the story: both how much you use and when you use it shape costs."}
              </p>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
