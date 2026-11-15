"use client";
import { useEffect, useState } from "react";
import { Workspace } from "./product-nav";
import { TariffEditor } from "./tariff-editor";
import { TaskPlanner } from "./task-planner";
import { WholesaleContext } from "./wholesale-context";
import { UsageView } from "./usage-view";
import { HomePlan } from "./home-plan";
import { useEnergyWorkspace } from "./energy-workspace";
import { gridRegions } from "@/lib/geo/regions";
type Tab = "tariff" | "planner" | "usage" | "plan";
export default function HomeApp() {
  const [tab, setTab] = useState<Tab>("tariff");
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
    changeRegion,
  } = useEnergyWorkspace();
  useEffect(() => {
    const query = new URL(location.href).searchParams;
    const view = query.get("view");
    if (["tariff", "planner", "usage", "plan"].includes(view ?? ""))
      setTab(view as Tab);
    const region = query.get("region");
    if (ready && region && gridRegions.some((r) => String(r.id) === region))
      changeRegion(region);
  }, [ready, changeRegion]);
  function changeTab(value: Tab) {
    setTab(value);
    history.replaceState(null, "", "/home?view=" + value);
  }
  if (!ready)
    return (
      <Workspace
        active="home"
        title="Make your energy work for you"
        intro="Your workspace stays private on this device."
      >
        <p role="status">Restoring your workspace…</p>
      </Workspace>
    );
  return (
    <Workspace
      active="home"
      title="Make your energy work for you"
      intro="Understand your rates, find useful windows and see where your electricity goes."
    >
      <div className="home-tabs tab-strip" aria-label="Your home views">
        {(
          [
            ["tariff", "Your tariff"],
            ["planner", "Task planner"],
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
          onTariff={() => changeTab("tariff")}
          onPlan={(window, kind) => {
            setState((s) => ({
              ...s,
              [kind === "price" ? "pricePlan" : "carbonPlan"]: window,
            }));
            changeTab("plan");
          }}
        />
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
            workspace; navigation keeps it in memory. Clearing data removes the
            saved workspace and current inputs.
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
    </Workspace>
  );
}
