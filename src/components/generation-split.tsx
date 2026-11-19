"use client";
import { useState, type CSSProperties } from "react";
import type { MixRow } from "@/lib/geo/balance";
const explanations: Record<string, string> = {
  wind: "Wind turbines turn moving air into electricity.",
  solar: "Solar panels turn daylight into electricity.",
  nuclear:
    "Nuclear reactors produce heat to drive electricity-generating turbines.",
  gas: "Gas-fired stations burn gas to drive turbines.",
  hydro: "Hydroelectric stations use flowing water to generate electricity.",
  biomass:
    "Biomass stations generate electricity from organic fuels. The source category does not imply zero emissions.",
  imports:
    "Electricity entering from neighbouring grids. Country transfers describe entry into GB, not direct supply to this region.",
  coal: "Coal-fired electricity reported in this observation.",
  oil: "Oil-fired electricity reported in this observation.",
  other: "Generation grouped as other by the data provider.",
};
export function SourceIcon({ fuel }: { fuel: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {fuel === "wind" ? (
        <g className="mix-rotor">
          <circle cx="16" cy="16" r="2" />
          <path d="M16 14V3l-3 7 3 4m2 3 9 5-5-6-4 1m-4 0-9 5 8-1 1-4" />
        </g>
      ) : fuel === "solar" ? (
        <>
          <circle className="mix-sun" cx="16" cy="16" r="6" />
          <path d="M16 2v5m0 18v5M2 16h5m18 0h5M6 6l4 4m12 12 4 4M6 26l4-4M22 10l4-4" />
        </>
      ) : fuel === "nuclear" ? (
        <>
          <circle cx="16" cy="16" r="2" />
          <ellipse cx="16" cy="16" rx="14" ry="5" />
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="5"
            transform="rotate(60 16 16)"
          />
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="5"
            transform="rotate(120 16 16)"
          />
        </>
      ) : fuel === "imports" ? (
        <path d="M3 11h23m-6-6 6 6-6 6M29 23H6m6-6-6 6 6 6" />
      ) : fuel === "hydro" ? (
        <path d="M16 3S6 15 6 21a10 10 0 0 0 20 0C26 15 16 3 16 3ZM11 22c0 3 2 5 5 5" />
      ) : fuel === "biomass" ? (
        <path d="M6 26C-1 9 15 6 28 4c-1 15-8 25-22 22Zm0 0L23 9" />
      ) : (
        <path d="M17 3c3 9-5 9 0 14 2-1 3-4 3-6 13 12 3 21-4 20C4 30 3 19 10 13c0 5 2 7 4 6-3-6 1-10 3-16Z" />
      )}
    </svg>
  );
}
export function GenerationSplit({
  rows,
  onFuelSelect,
  onImports,
  motion = true,
  mapVisible = true,
  onExploreSource,
  selectedFuel,
  compact = false,
}: {
  rows: MixRow[];
  onFuelSelect?: (fuel: string) => void;
  onImports?: () => void;
  motion?: boolean;
  mapVisible?: boolean;
  onExploreSource?: (fuel: string) => void;
  selectedFuel?: string | null;
  compact?: boolean;
}) {
  const [internal, setInternal] = useState<string | null>(null);
  const selected = selectedFuel === undefined ? internal : selectedFuel;
  const active = rows.find((f) => f.fuel === selected);
  if (!rows.length)
    return (
      <p className="empty-state">
        Generation mix unavailable for this region and period.
      </p>
    );
  return (
    <div className="source-blocks" data-motion={motion ? "on" : "off"}>
      <p className="source-blocks-hint">Choose a source to see its stations</p>
      <ul className="source-block-grid" aria-label="Generation split">
        {rows.map((f) => (
          <li key={f.fuel}>
            <button
              className={selected === f.fuel ? "is-active" : ""}
              aria-pressed={selected === f.fuel}
              style={{ "--source-color": f.color } as CSSProperties}
              aria-label={`${f.label} ${f.perc.toFixed(1)}%${f.mw !== undefined ? ` · ${(f.mw / 1000).toFixed(1)} GW` : ""}. Show on map`}
              onClick={() => {
                setInternal(f.fuel);
                onFuelSelect?.(f.fuel);
              }}
            >
              <span className="source-block-name">
                <SourceIcon fuel={f.fuel} />
                {f.label}
              </span>
              <strong>
                {f.perc.toFixed(1)}
                <small>%</small>
              </strong>
              {f.mw !== undefined && (
                <span className="source-block-output">
                  {(f.mw / 1000).toFixed(1)} GW
                </span>
              )}
              <span className="source-block-meter" aria-hidden="true">
                <i
                  style={{ width: `${Math.max(0, Math.min(100, f.perc))}%` }}
                />
              </span>
              {selected === f.fuel && (
                <span className="source-block-selected" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!compact && (
        <div className="source-block-explanation" aria-live="polite">
          {active ? (
            <p>
              <b>{active.label}</b> ·{" "}
              {explanations[active.fuel] ?? explanations.other}
            </p>
          ) : (
            <p>Each source opens its locations on the map.</p>
          )}
          {active?.fuel === "imports" && onImports && (
            <button className="text-button" onClick={onImports}>
              See supplying countries ↗
            </button>
          )}
          {active && active.fuel !== "imports" && onFuelSelect && (
            <span className="small">
              {mapVisible
                ? "GB site locations · individual output unavailable"
                : "Select a source to open its map"}
            </span>
          )}
          {active && !mapVisible && onExploreSource && (
            <button
              className="text-button"
              onClick={() => onExploreSource(active.fuel)}
            >
              Browse {active.label.toLowerCase()} sites ↗
            </button>
          )}
        </div>
      )}
    </div>
  );
}
