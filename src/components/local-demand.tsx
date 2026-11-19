"use client";
import { useState } from "react";
import annual from "../../data/annual-consumption.json";
export function LocalDemand() {
  const [authority, setAuthority] = useState("");
  const local = annual.find((a) => a.code === authority);
  return (
    <section className="annual-section">
      <p className="eyebrow">ANNUAL LOCAL CONSUMPTION · DESNZ 2024</p>
      <h2>Where local electricity is used</h2>
      <p>
        Homes and non-domestic premises, including businesses and public
        services. These are annual metered-consumption estimates, not live
        sector demand.
      </p>
      <label htmlFor="authority">Choose a local authority</label>
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
                  {((100 * local.nonDomesticGwh) / local.totalGwh).toFixed(1)}%
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
  );
}
