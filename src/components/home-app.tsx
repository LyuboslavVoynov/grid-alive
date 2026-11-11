"use client";
import { useEffect, useState } from "react";
import { Workspace } from "./product-nav";
import { TariffEditor } from "./tariff-editor";
import { TaskPlanner } from "./task-planner";
import { WholesaleContext } from "./wholesale-context";
import { UsageView } from "./usage-view";
import { HomePlan } from "./home-plan";
import {
  type HomeState,
  decodeHomeState,
  storageKey,
} from "@/lib/home/storage";
const empty: HomeState = {
  tariff: null,
  readings: [],
  pricePlan: null,
  carbonPlan: null,
};
type Tab = "tariff" | "planner" | "usage" | "plan";
export default function HomeApp() {
  const [tab, setTab] = useState<Tab>("tariff"),
    [state, setState] = useState<HomeState>(empty),
    [remember, setRemember] = useState(false),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(""),
    [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    try {
      const value = localStorage.getItem(storageKey);
      if (value) {
        setState(decodeHomeState(value));
        setRemember(true);
      }
    } catch {
      setStorageError(
        "Saved workspace could not be restored. You can import your file again or clear saved data.",
      );
    }
    setReady(true);
    const value = new URL(location.href).searchParams.get("view");
    if (["tariff", "planner", "usage", "plan"].includes(value ?? ""))
      setTab(value as Tab);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      if (remember)
        localStorage.setItem(
          storageKey,
          JSON.stringify({ version: 1, ...state }),
        );
      else localStorage.removeItem(storageKey);
    } catch {
      setStorageError(
        "This browser could not save the workspace. Your current session still works; download or keep your original file.",
      );
    }
  }, [remember, state, ready]);
  function changeTab(value: Tab) {
    setTab(value);
    history.replaceState(null, "", "/home?view=" + value);
  }
  function clear() {
    setResetKey((v) => v + 1);
    setState(empty);
    setRemember(false);
    setStorageError("");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setStorageError(
        "Browser storage could not be cleared. Clear site data in your browser settings.",
      );
    }
  }
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
      {tab === "tariff" ? (
        <>
          <TariffEditor
            key={resetKey}
            tariff={state.tariff}
            onSave={(tariff) =>
              setState((s) => ({
                ...s,
                tariff,
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
            Remember my tariff, imported readings and saved windows on this
            browser
          </label>
          <p>
            Off by default. Data stays on this device; use carefully on shared
            computers. Leaving or reloading clears an unsaved workspace.
            Clearing data removes the saved workspace and current inputs.
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
