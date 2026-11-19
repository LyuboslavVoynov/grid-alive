"use client";
import { useState } from "react";
import { NumberChoice } from "./number-choice";
import { type Tariff, money } from "@/lib/home/energy";
export function AnnualCosts({ tariff }: { tariff: Tariff | null }) {
  const [annualKwh, setAnnualKwh] = useState(""),
    [alternativeRate, setAlternative] = useState(""),
    [alternativeStanding, setStanding] = useState(""),
    [offShare, setShare] = useState("");
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
  return (
    <section>
      <h2>Compare annual costs</h2>
      <p>
        Compare a hypothetical single-rate alternative over 365 days, including
        standing charges. Choose clearly labelled example assumptions, or
        optionally refine them with exact values from your bill. This is a
        scenario, not a supplier quote or eligibility check.
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
                Current tariff annual estimate <b>{money(existingAnnual)}</b>
              </p>
              <p>
                Difference <b>{money(existingAnnual - alternativeAnnual)}</b>
              </p>
            </>
          ) : (
            <p>
              Current annual cost needs a manual tariff and, for two-rate
              tariffs, an off-peak usage assumption. Unpublished dynamic prices
              cannot support a reliable annual comparison.
            </p>
          )}
        </div>
      ) : (
        <p className="small">
          Choose annual consumption and both alternative rates to calculate.
        </p>
      )}
      <p className="small">
        Assumes unchanged rates and consumption for 365 days; excludes exit
        fees, discounts, rewards and future tariff changes. Positive difference
        means the alternative costs less under these inputs.
      </p>
    </section>
  );
}
