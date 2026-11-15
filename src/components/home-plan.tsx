"use client";
import { NumberChoice } from "./number-choice";
import { useEffect, useState } from "react";
import { type Tariff, type TaskWindow, money } from "@/lib/home/energy";
import { type Reading, summarize } from "@/lib/home/usage";
import { localTime } from "./series-chart";
export function calendarLink(w: TaskWindow, title: string) {
  const stamp = (v: string) =>
    new Date(v)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const text = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GRID ALIVE//Local Plan//EN",
    "BEGIN:VEVENT",
    `UID:grid-alive-${stamp(w.from)}@local`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(w.from)}`,
    `DTEND:${stamp(w.to)}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:Estimated task window. Check current tariff and forecast before use. Nothing is switched automatically.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(text);
}
export function HomePlan({
  tariff,
  readings,
  pricePlan,
  carbonPlan,
  onPlanner,
  onUsage,
}: {
  tariff: Tariff | null;
  readings: Reading[];
  pricePlan: TaskWindow | null;
  carbonPlan: TaskWindow | null;
  onPlanner: () => void;
  onUsage: () => void;
}) {
  const s = summarize(readings, tariff),
    [priceReminder, setPriceReminder] = useState(false),
    [carbonReminder, setCarbonReminder] = useState(false),
    [now, setNow] = useState(() => Date.now());
  const [annualKwh, setAnnualKwh] = useState(""),
    [alternativeRate, setAlternative] = useState(""),
    [alternativeStanding, setStanding] = useState(""),
    [offShare, setShare] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const valid =
    Number(annualKwh) > 0 &&
    Number(annualKwh) <= 100000 &&
    alternativeRate !== "" &&
    Number.isFinite(Number(alternativeRate)) &&
    Number(alternativeRate) >= -100 &&
    Number(alternativeRate) <= 1000 &&
    alternativeStanding !== "" &&
    Number(alternativeStanding) >= 0 &&
    Number(alternativeStanding) <= 1000;
  const blended =
    tariff?.kind === "single"
      ? tariff.unit
      : tariff?.kind === "tou" &&
          offShare !== "" &&
          Number(offShare) >= 0 &&
          Number(offShare) <= 100
        ? tariff.unit * (1 - Number(offShare) / 100) +
          (tariff.offPeak * Number(offShare)) / 100
        : null;
  const existingAnnual =
      valid && tariff && blended !== null
        ? Number(annualKwh) * blended + 365 * tariff.standing
        : null,
    alternativeAnnual = valid
      ? Number(annualKwh) * Number(alternativeRate) +
        365 * Number(alternativeStanding)
      : null;
  function reminder(w: TaskWindow | null, enabled: boolean) {
    if (!w || !enabled) return null;
    const start = Date.parse(w.from),
      end = Date.parse(w.to);
    return now >= end
      ? "This saved window has passed. Refresh your plan."
      : now >= start
        ? "Your saved task window is open now. Check current rates before starting."
        : `Your saved window begins ${localTime(w.from)}. Keep this page open for the in-page reminder.`;
  }
  const selected = (title: string, w: TaskWindow | null) => (
    <div className="saved-window">
      <p className="eyebrow">{title}</p>
      {w ? (
        <>
          <h3>{localTime(w.from)}</h3>
          {w.assumptions && <p>{w.assumptions}</p>}
          <p>
            Until {localTime(w.to)} ·{" "}
            {w.cost === null
              ? "Cost unavailable"
              : `${money(w.cost)} estimated energy cost`}
          </p>
          <p>
            {w.carbon === null
              ? "Carbon unavailable"
              : `${Math.round(w.carbon)} gCO₂ forecast for task`}
          </p>
          <a
            className="text-link"
            download="grid-alive-task-window.ics"
            href={calendarLink(w, "GRID ALIVE task window")}
          >
            Add this window to my calendar ↓
          </a>
          <p className="small">
            Saved estimate, not a refreshed rate or forecast.
          </p>
        </>
      ) : (
        <p>
          No saved window yet.{" "}
          <button className="text-button" onClick={onPlanner}>
            Choose one in the planner ↗
          </button>
        </p>
      )}
    </div>
  );
  return (
    <section>
      <p className="eyebrow">SMALL ACTIONS, EXPLAINED</p>
      <h2>A practical plan for your home</h2>
      <p className="section-copy">
        Use your own inputs to decide what is useful. Estimates show their
        assumptions; nothing is switched automatically.
      </p>
      <div className="plan-actions">
        <details open>
          <summary>
            <span>01</span>
            <b>Shift flexible usage</b>
            <small>Based on your tariff</small>
          </summary>
          <div>
            <p>
              Move tasks only when it suits you and your tariff offers a
              lower-cost window. A single-rate tariff has no unit-price saving
              for shifting the same energy.
            </p>
            <div className="saved-windows">
              {selected("LOWER-COST WINDOW", pricePlan)}
              {selected("LOWER-CARBON WINDOW", carbonPlan)}
            </div>
            <button className="text-button" onClick={onPlanner}>
              Recalculate task windows ↗
            </button>
          </div>
        </details>
        <details>
          <summary>
            <span>02</span>
            <b>Investigate your baseline</b>
            <small>
              {s.baselineKw === null
                ? "Needs readings"
                : "From imported readings"}
            </small>
          </summary>
          <div>
            <h3>
              {s.baselineKw === null
                ? "Find your overnight pattern"
                : `${Math.round(s.baselineKw * 1000)} W median overnight load`}
            </h3>
            <p>
              Review persistent overnight consumption and decide what can safely
              be switched off. Meter totals cannot identify individual
              appliances, and some background use is essential. Verify any
              change with later readings; the whole baseline is not an
              achievable saving.
            </p>
            <button className="text-button" onClick={onUsage}>
              Review my usage ↗
            </button>
          </div>
        </details>
        <details>
          <summary>
            <span>03</span>
            <b>Compare the whole tariff cost</b>
            <small>Needs your assumptions</small>
          </summary>
          <div>
            <p>
              Compare a hypothetical single-rate alternative over 365 days,
              including standing charges. Choose clearly labelled example
              assumptions, or optionally refine them with exact values from your
              bill. This is a scenario, not a supplier quote or eligibility
              check.
            </p>
            <div className="field-grid">
              <NumberChoice
                id="annual-kwh"
                label="Annual electricity assumption · kWh"
                value={annualKwh}
                onChange={setAnnualKwh}
                values={[1500, 2500, 3500, 4500, 6000, 10000]}
                unit="kWh/year"
                min={1}
                max={100000}
                step={1}
                scenario
              />
              <NumberChoice
                id="alternative-rate"
                label="Alternative rate assumption · p/kWh"
                value={alternativeRate}
                onChange={setAlternative}
                values={[15, 20, 25, 30, 35, 40, 50, 60]}
                unit="p/kWh"
                min={-100}
                max={1000}
                step={0.001}
                scenario
              />
              <NumberChoice
                id="alternative-standing"
                label="Alternative standing assumption · p/day"
                value={alternativeStanding}
                onChange={setStanding}
                values={[0, 25, 40, 50, 60, 75, 100]}
                unit="p/day"
                min={0}
                max={1000}
                step={0.001}
                scenario
              />
              {tariff?.kind === "tou" && (
                <NumberChoice
                  id="annual-offpeak"
                  label="Assumed off-peak use · %"
                  value={offShare}
                  onChange={setShare}
                  values={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  unit="%"
                  min={0}
                  max={100}
                  step={1}
                  scenario
                />
              )}
            </div>
            {alternativeAnnual !== null ? (
              <div className="annual-comparison">
                <p>
                  Alternative annual estimate <b>{money(alternativeAnnual)}</b>
                </p>
                {existingAnnual !== null ? (
                  <>
                    <p>
                      Current tariff annual estimate{" "}
                      <b>{money(existingAnnual)}</b>
                    </p>
                    <p>
                      Difference{" "}
                      <b>{money(existingAnnual - alternativeAnnual)}</b>
                    </p>
                  </>
                ) : (
                  <p>
                    Current annual cost needs a manual tariff and, for two-rate
                    tariffs, an off-peak usage assumption. Unpublished dynamic
                    prices cannot support a reliable annual comparison.
                  </p>
                )}
              </div>
            ) : (
              <p className="small">
                Choose annual consumption and both alternative rates to
                calculate.
              </p>
            )}
            <p className="small">
              Assumes unchanged rates and consumption for 365 days; excludes
              exit fees, discounts, rewards and future tariff changes. Positive
              difference means the alternative costs less under these inputs.
            </p>
          </div>
        </details>
      </div>
      <section className="reminder-preferences">
        <p className="eyebrow">OPTIONAL REMINDERS</p>
        <div>
          <label>
            <input
              type="checkbox"
              checked={priceReminder}
              disabled={!pricePlan}
              onChange={(e) => setPriceReminder(e.target.checked)}
            />{" "}
            Lower-cost window · in-page
          </label>
          <label>
            <input
              type="checkbox"
              checked={carbonReminder}
              disabled={!carbonPlan}
              onChange={(e) => setCarbonReminder(e.target.checked)}
            />{" "}
            Lower-carbon window · in-page
          </label>
        </div>
        <p className="small">
          Reminders start off. In-page reminders work while this view is open.
          Use the calendar download for a reminder outside the site; your
          calendar controls notifications.
        </p>
        {reminder(pricePlan, priceReminder) && (
          <p className="reminder-banner" role="status">
            Cost: {reminder(pricePlan, priceReminder)}
          </p>
        )}
        {reminder(carbonPlan, carbonReminder) && (
          <p className="reminder-banner" role="status">
            Carbon: {reminder(carbonPlan, carbonReminder)}
          </p>
        )}
      </section>
    </section>
  );
}
