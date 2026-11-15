"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  decodeHomeState,
  defaultTaskDraft,
  storageKey,
  type HomeState,
} from "@/lib/home/storage";
import { validateTariff } from "@/lib/home/energy";
import { validRegionId } from "@/lib/geo/regions";
const initial: HomeState = {
  regionId: "",
  taskDraft: defaultTaskDraft,
  tariff: null,
  readings: [],
  pricePlan: null,
  carbonPlan: null,
};
type Context = {
  state: HomeState;
  setState: Dispatch<SetStateAction<HomeState>>;
  remember: boolean;
  setRemember: Dispatch<SetStateAction<boolean>>;
  ready: boolean;
  storageError: string;
  tariffStatus: string;
  resetKey: number;
  clear: () => void;
  changeRegion: (id: string) => void;
};
const EnergyContext = createContext<Context | null>(null);
export function EnergyWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<HomeState>(initial),
    [remember, setRemember] = useState(false),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(""),
    [resetKey, setResetKey] = useState(0),
    [tariffStatus, setTariffStatus] = useState("");
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
        "This browser could not save the workspace. The current session still works; keep your original reading file.",
      );
    }
  }, [state, remember, ready]);
  useEffect(() => {
    setTariffStatus("");
    const product = state.tariff?.productCode,
      tariff = state.tariff?.tariffCode;
    if (!ready || !product || !tariff) return;
    const controller = new AbortController();
    let lastAttempt = state.tariff?.retrievedAt
      ? Date.parse(state.tariff.retrievedAt)
      : 0;
    async function refresh() {
      if (document.hidden || Date.now() - lastAttempt < 300000) return;
      lastAttempt = Date.now();
      try {
        const response = await fetch(
          `/api/tariffs?product=${encodeURIComponent(product!)}&tariff=${encodeURIComponent(tariff!)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok || data.stale) throw Error();
        const next = validateTariff(data.tariff);
        if (!controller.signal.aborted) {
          setState((s) =>
            s.tariff &&
            s.tariff.productCode === product &&
            s.tariff.tariffCode === tariff
              ? { ...s, tariff: next }
              : s,
          );
          setTariffStatus("");
        }
      } catch {
        if (!controller.signal.aborted)
          setTariffStatus(
            "Public tariff refresh is delayed. Last received published rates are shown; uncovered periods remain unknown.",
          );
      }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ready, state.tariff?.productCode, state.tariff?.tariffCode]);
  function clear() {
    setState(initial);
    setRemember(false);
    setResetKey((v) => v + 1);
    setStorageError("");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setStorageError(
        "Browser storage could not be cleared. Clear site data in your browser settings.",
      );
    }
  }
  const changeRegion = useCallback((id: string) => {
    if (id) validRegionId(id);
    setState((s) => (s.regionId === id ? s : { ...s, regionId: id }));
  }, []);
  return (
    <EnergyContext.Provider
      value={{
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
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
}
export function useEnergyWorkspace() {
  const context = useContext(EnergyContext);
  if (!context) throw Error("Energy workspace provider is missing");
  return context;
}
