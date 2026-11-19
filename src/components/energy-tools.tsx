"use client";
import { useState, useEffect, useRef } from "react";
import { TariffEditor } from "./tariff-editor";
import { TaskPlanner } from "./task-planner";
import { WholesaleContext } from "./wholesale-context";
import { UsageView } from "./usage-view";
import { HomePlan } from "./home-plan";
import { AnnualCosts } from "./annual-costs";
import { useEnergyWorkspace } from "./energy-workspace";
import type { PlanningForecast } from "@/lib/home/carbon-source";
type Tab = "tariff" | "planner" | "annual" | "usage" | "plan";
export function EnergyTools({
  initialTab,
  forecast,
}: {
  initialTab: Tab;
  forecast: PlanningForecast;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const root = useRef<HTMLDivElement>(null);
  const focusTab = useRef(false);
  useEffect(() => {
    root.current?.closest("dialog")?.scrollTo({ top: 0 });
    if (focusTab.current)
      root.current
        ?.querySelector<HTMLButtonElement>(
          '.home-tabs button[aria-pressed="true"]',
        )
        ?.focus({ preventScroll: true });
    focusTab.current = false;
  }, [tab]);
  const {
    state,
    setState,
    remember,
    setRemember,
    ready,
    storageError,
    tariffStatus,
    resetKey,
    clear,
  } = useEnergyWorkspace();
  function changeTab(value: Tab) {
    if (value === tab) return;
    focusTab.current = !!root.current
      ?.querySelector(".energy-tool-panel")
      ?.contains(document.activeElement);
    setTab(value);
  }
  if (!ready) return <p role="status">Restoring your workspace…</p>;
  return (
    <div className="energy-tools" ref={root}>
      <div className="home-tabs tab-strip" aria-label="Energy tool views">
        {(
          [
            ["tariff", "Your tariff"],
            ["planner", "Task planner"],
            ["annual", "Annual costs"],
            ["usage", "My usage"],
            ["plan", "My plan"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            onClick={() => changeTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tariffStatus && (
        <p className="coverage-note" role="status">
          {tariffStatus}
        </p>
      )}
      <div className="energy-tool-panel" key={tab}>
        {tab === "tariff" ? (
          <>
            <TariffEditor
              key={resetKey}
              tariff={state.tariff}
              onSave={(tariff) =>
                setState((s) => ({
                  ...s,
                  tariff,
                  regionId: s.regionId || tariff.regionId || "",
                  pricePlan: null,
                  carbonPlan: null,
                }))
              }
            />
            {state.tariff && (
              <button
                className="text-button"
                onClick={() => changeTab("planner")}
              >
                Continue to the task planner ↗
              </button>
            )}
            <WholesaleContext />
          </>
        ) : tab === "planner" ? (
          <TaskPlanner
            key={resetKey}
            tariff={state.tariff}
            forecast={forecast}
            onTariff={() => changeTab("tariff")}
            onPlan={(window, kind) => {
              setState((s) => ({
                ...s,
                [kind === "price" ? "pricePlan" : "carbonPlan"]: window,
              }));
              changeTab("plan");
            }}
          />
        ) : tab === "annual" ? (
          <AnnualCosts tariff={state.tariff} />
        ) : tab === "usage" ? (
          <UsageView
            key={resetKey}
            tariff={state.tariff}
            readings={state.readings}
            onReadings={(readings) => setState((s) => ({ ...s, readings }))}
            onTariff={() => changeTab("tariff")}
          />
        ) : (
          <HomePlan
            key={resetKey}
            tariff={state.tariff}
            readings={state.readings}
            pricePlan={state.pricePlan}
            carbonPlan={state.carbonPlan}
            onPlanner={() => changeTab("planner")}
            onUsage={() => changeTab("usage")}
          />
        )}
      </div>
      <section className="privacy-controls">
        <div>
          <p className="eyebrow">YOUR DATA, YOUR CHOICE</p>
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Remember my region, tariff, task choices, imported readings and
            saved windows on this browser
          </label>
          <p>
            Off by default. Data stays on this device; use carefully on shared
            computers. Reloading or closing the site clears an unsaved
            workspace; switching tools keeps it in memory. Clearing data removes
            the saved workspace and current inputs.
          </p>
        </div>
        <button className="subtle-button" onClick={clear}>
          Clear my workspace
        </button>
      </section>
      {storageError && (
        <p className="form-message" role="status">
          {storageError}
        </p>
      )}
    </div>
  );
}
