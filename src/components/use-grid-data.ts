"use client";
import { useEffect, useState } from "react";
import type { AreaData } from "@/types/area";
import type { Regional, Snapshot } from "@/types/electricity";

function usePublicData<T>(url: string | null, intervalMs: number) {
  const [result, setResult] = useState<{
    url: string | null;
    data: T | null;
    error: string;
    loading: boolean;
  }>({ url: null, data: null, error: "", loading: false });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let pending = false;
    setResult({ url, data: null, error: "", loading: true });
    async function refresh() {
      if (pending || document.hidden || controller.signal.aborted) return;
      pending = true;
      try {
        const response = await fetch(url!, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw Error(
            "This data source is unavailable. Last received data, if any, is retained.",
          );
        const data = (await response.json()) as T;
        if (!controller.signal.aborted)
          setResult({ url, data, error: "", loading: false });
      } catch (e) {
        if (!controller.signal.aborted)
          setResult((old) => ({
            ...old,
            url,
            error: e instanceof Error ? e.message : "Data unavailable",
            loading: false,
          }));
      } finally {
        pending = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, intervalMs);
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [url, intervalMs]);
  // A response from a previous selection must not flash under the new region's heading.
  return result.url === url
    ? result
    : { url, data: null, error: "", loading: !!url };
}
export function useGridData(regionId: string) {
  const grid = usePublicData<Snapshot>("/api/grid", 60000);
  const regional = usePublicData<Regional>("/api/regional", 300000);
  const area = usePublicData<AreaData>(
    regionId ? "/api/area?region=" + encodeURIComponent(regionId) : null,
    300000,
  );
  return { grid, regional, area };
}
