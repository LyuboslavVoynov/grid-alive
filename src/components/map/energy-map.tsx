"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LibreMap } from "maplibre-gl";
import type { Regional } from "@/types/electricity";
import type { FeatureCollection } from "geojson";
import { type Coast } from "@/lib/geo/scene";
import { type EnergyAsset } from "@/lib/geo/assets";
import { sourceMarkers, sourceInventory } from "@/lib/geo/source-map";
import { countryCorridors } from "@/lib/geo/quiet-atlas";
import { mapPadding } from "@/lib/geo/night-atlas";
import { SceneRenderer, type SceneSettings } from "./scene-renderer";
export type MapControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};
export function EnergyMap({
  settings,
  onControls,
  onSelect,
  onCluster,
  mode,
  regional,
  selectedRegionId,
  onRegionSelect,
  focusPoint = null,
}: {
  settings: SceneSettings;
  mode: "flow" | "carbon" | "connections";
  regional: Regional | null;
  selectedRegionId: number | null;
  focusPoint?: [number, number] | null;
  onRegionSelect: (id: number) => void;
  onControls: (controls: MapControls | null) => void;
  onSelect: (farm: EnergyAsset) => void;
  onCluster: (sites: EnergyAsset[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    renderer = useRef<SceneRenderer | null>(null),
    mapRef = useRef<LibreMap | null>(null),
    settingsRef = useRef(settings),
    focusRef = useRef(focusPoint),
    regionSelectRef = useRef(onRegionSelect),
    selectRef = useRef(onSelect),
    clusterRef = useRef(onCluster),
    syncRef = useRef<() => void>(() => {}),
    fitRef = useRef<((reset?: boolean) => void) | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready && focusPoint)
      mapRef.current?.flyTo({
        center: focusPoint,
        zoom: 6.2,
        duration: settingsRef.current.playing ? 650 : 0,
      });
  }, [ready, focusPoint]);
  settingsRef.current = settings;
  focusRef.current = focusPoint;
  regionSelectRef.current = onRegionSelect;
  selectRef.current = onSelect;
  clusterRef.current = onCluster;
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    Promise.all([
      import("maplibre-gl"),
      fetch("/geo/coasts.json").then((r) => {
        if (!r.ok) throw Error("Map geometry unavailable");
        return r.json() as Promise<Coast[]>;
      }),
      fetch("/geo/regions.json").then(
        (r) => r.json() as Promise<FeatureCollection>,
      ),
    ])
      .then(([lib, coasts, regions]) => {
        if (disposed || !container.current || !canvas.current) return;
        for (const f of regions.features) f.id = f.properties?.regionId;
        const data: FeatureCollection = {
          type: "FeatureCollection",
          features: coasts.map((c) => ({
            type: "Feature",
            properties: { name: c.name },
            geometry: {
              type: "MultiPolygon",
              coordinates: c.rings.map((r) => [r]),
            },
          })),
        };
        lib.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
        const map = new lib.Map({
          container: container.current,
          style: {
            version: 8,
            sources: {
              land: { type: "geojson", data },
              regions: { type: "geojson", data: regions },
            },
            layers: [
              {
                id: "ocean",
                type: "background",
                paint: { "background-color": "#071119" },
              },
              {
                id: "land",
                type: "fill",
                source: "land",
                paint: {
                  "fill-color": [
                    "case",
                    ["==", ["get", "name"], "United Kingdom"],
                    "#101f29",
                    "#0b1922",
                  ],
                },
              },
              {
                id: "regional-carbon",
                type: "fill",
                source: "regions",
                layout: { visibility: "none" },
                paint: {
                  "fill-opacity": [
                    "case",
                    ["boolean", ["feature-state", "available"], false],
                    0.58,
                    0,
                  ],
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ["coalesce", ["feature-state", "intensity"], 0],
                    0,
                    "#318b80",
                    100,
                    "#82b7a2",
                    200,
                    "#b6ac65",
                    300,
                    "#ad744d",
                    500,
                    "#944e51",
                  ],
                },
              },
              {
                id: "coast-glow",
                type: "line",
                source: "land",
                paint: {
                  "line-color": "#43c2cf",
                  "line-opacity": [
                    "case",
                    ["==", ["get", "name"], "United Kingdom"],
                    0.08,
                    0.025,
                  ],
                  "line-width": 5,
                  "line-blur": 4,
                },
              },
              {
                id: "coast",
                type: "line",
                source: "land",
                paint: {
                  "line-color": [
                    "case",
                    ["==", ["get", "name"], "United Kingdom"],
                    "#56868e",
                    "#223740",
                  ],
                  "line-width": 0.75,
                  "line-opacity": 0.85,
                },
              },
              {
                id: "region-hit",
                type: "fill",
                source: "regions",
                paint: {
                  "fill-color": "#8ed4ce",
                  "fill-opacity": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    0.12,
                    0.01,
                  ],
                },
              },
              {
                id: "region-outline",
                type: "line",
                source: "regions",
                paint: {
                  "line-color": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    "#a7e4da",
                    "#36515d",
                  ],
                  "line-width": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    1.4,
                    0.5,
                  ],
                  "line-opacity": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    0.8,
                    0,
                  ],
                },
              },
            ],
          },
          center: [-2, 54.5],
          zoom: 5,
          minZoom: 3,
          maxZoom: 10,
          maxPitch: 0,
          pitch: 0,
          bearing: 0,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          attributionControl: false,
          renderWorldCopies: false,
        });
        mapRef.current = map;
        map.touchZoomRotate.disableRotation();
        map.keyboard.disableRotation();
        const fit = (reset = false) => {
          const { clientWidth: width, clientHeight: height } =
            map.getContainer();
          if (disposed || width < 1 || height < 1) return;
          if (focusRef.current && settingsRef.current.wind && !reset) {
            map.jumpTo({ center: focusRef.current, zoom: 6.2 });
            return;
          }
          const corridor = settingsRef.current.connections
            ? countryCorridors.find(
                (c) => c.country === settingsRef.current.country,
              )
            : null;
          // Small maps focus the chosen corridor instead of hiding it under the HUD.
          const inventory = sourceInventory(
            settingsRef.current.allSources
              ? null
              : settingsRef.current.sourceFuel,
          );
          const points =
            !corridor &&
            settingsRef.current.wind &&
            !settingsRef.current.allSources &&
            inventory.length
              ? inventory.map((a) => a.point)
              : corridor && width < 500
                ? [corridor.from, corridor.to].flatMap(([lon, lat]) => [
                    [lon - 0.7, lat - 0.7],
                    [lon + 0.7, lat + 0.7],
                  ])
                : [
                    [-7.2, 49.9],
                    [2.0, 60.9],
                    ...(corridor ? [corridor.from, corridor.to] : []),
                  ];
          map.fitBounds(
            [
              [
                Math.min(...points.map((p) => p[0])),
                Math.min(...points.map((p) => p[1])),
              ],
              [
                Math.max(...points.map((p) => p[0])),
                Math.max(...points.map((p) => p[1])),
              ],
            ],
            {
              padding: mapPadding(
                width,
                height,
                settingsRef.current.connections
                  ? "connections"
                  : settingsRef.current.wind
                    ? "flow"
                    : "carbon",
              ),
              maxZoom: 6.2,
              duration: settingsRef.current.playing ? 650 : 0,
            },
          );
        };
        fitRef.current = fit;
        map
          .getCanvas()
          .setAttribute(
            "aria-label",
            "Interactive top-down map of Great Britain. Use arrow keys to pan, plus and minus to zoom.",
          );
        const scene = new SceneRenderer(
          canvas.current,
          map,
          coasts,
          settingsRef.current,
        );
        renderer.current = scene;
        const targets = new Map<
          string,
          { marker: import("maplibre-gl").Marker; button: HTMLButtonElement }
        >();
        const syncSources = () => {
          if (disposed) return;
          const groups = settingsRef.current.wind
            ? sourceMarkers(
                settingsRef.current.allSources
                  ? null
                  : settingsRef.current.sourceFuel,
                (p) => {
                  const q = map.project(p);
                  return [q.x, q.y];
                },
                map.getContainer().clientWidth,
                map.getContainer().clientHeight,
              )
            : [];
          const keys = new Set(groups.map((g) => g.id));
          for (const [key, target] of targets)
            if (!keys.has(key)) {
              target.marker.remove();
              targets.delete(key);
            }
          for (const group of groups) {
            let target = targets.get(group.id);
            if (!target) {
              const wrapper = document.createElement("div");
              wrapper.className = "source-marker";
              const button = document.createElement("button");
              button.className = "source-marker-target";
              button.type = "button";
              button.setAttribute(
                "aria-label",
                group.assets.length > 1
                  ? `${group.assets.length} generating sites. Zoom to explore group`
                  : `${group.assets[0].name}, ${group.assets[0].fuel}. Select station`,
              );
              button.addEventListener("click", (e) => {
                e.stopPropagation();
                if (group.assets.length === 1) {
                  selectRef.current(group.assets[0]);
                  return;
                }
                const lons = group.assets.map((a) => a.point[0]),
                  lats = group.assets.map((a) => a.point[1]);
                if (
                  map.getZoom() >= 8.5 ||
                  (Math.max(...lons) - Math.min(...lons) < 0.001 &&
                    Math.max(...lats) - Math.min(...lats) < 0.001)
                ) {
                  clusterRef.current(group.assets);
                  return;
                }
                const projected = group.assets.map((a) => map.project(a.point));
                const center = map.unproject([
                  projected.reduce((n, p) => n + p.x, 0) / projected.length,
                  projected.reduce((n, p) => n + p.y, 0) / projected.length,
                ]);
                map.getCanvas().focus({ preventScroll: true });
                map.easeTo({
                  center,
                  zoom: Math.min(10, map.getZoom() + 1.6),
                  duration: settingsRef.current.playing ? 450 : 0,
                });
              });
              wrapper.append(button);
              const marker = new lib.Marker({
                element: wrapper,
                anchor: "center",
              })
                .setLngLat(map.unproject(group.screen))
                .addTo(map);
              target = { marker, button };
              targets.set(group.id, target);
            }
            target.button.setAttribute(
              "aria-label",
              group.assets.length > 1
                ? `${group.assets.length} generating sites. Zoom to explore group`
                : `${group.assets[0].name}, ${group.assets[0].fuel}. Select station`,
            );
            target.button.setAttribute(
              "aria-pressed",
              String(
                group.assets.some(
                  (a) => a.id === settingsRef.current.selectedId,
                ),
              ),
            );
            target.marker.setLngLat(map.unproject(group.screen));
          }
        };
        syncRef.current = syncSources;
        map.on("move", syncSources);

        map.on("move", scene.redraw);
        map.on("render", scene.render);
        map.on("load", () => {
          fit();
          syncSources();
          setReady(true);
        });
        const observer = new ResizeObserver(() => {
          if (disposed) return;
          map.resize();
          scene.resize();
          syncSources();
        });
        observer.observe(container.current);
        document.addEventListener("visibilitychange", scene.visibility);
        map.on("click", (e) => {
          if (settingsRef.current.connections) return;
          const feature = map.queryRenderedFeatures(e.point, {
            layers: ["region-hit"],
          })[0];
          const id = Number(feature?.properties?.regionId);
          if (Number.isInteger(id) && id >= 1 && id <= 14)
            regionSelectRef.current(id);
        });
        map.on("mousemove", (e) => {
          map.getCanvas().style.cursor =
            !settingsRef.current.connections &&
            map.queryRenderedFeatures(e.point, { layers: ["region-hit"] })
              .length
              ? "pointer"
              : "";
        });
        onControls({
          zoomIn: () =>
            map.zoomIn({ duration: settingsRef.current.playing ? 250 : 0 }),
          zoomOut: () =>
            map.zoomOut({ duration: settingsRef.current.playing ? 250 : 0 }),
          reset: () => fit(true),
        });
        map.on("error", (e) => {
          console.error("Map rendering error", e.error?.message);
          setError("A geographic layer could not load");
        });
        cleanup = () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", scene.visibility);
          for (const target of targets.values()) target.marker.remove();
          targets.clear();
          syncRef.current = () => {};
          scene.destroy();
          map.off("render", scene.render);
          map.remove();
          fitRef.current = null;
          renderer.current = null;
          mapRef.current = null;
          onControls(null);
        };
      })
      .catch((e) => {
        if (!disposed)
          setError(e instanceof Error ? e.message : "Map could not load");
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [onControls]);
  useEffect(() => {
    renderer.current?.update(settings);
    if (ready) syncRef.current();
  }, [settings, ready]);
  useEffect(() => {
    if (ready) fitRef.current?.();
  }, [ready, mode, settings.country, settings.sourceFuel, settings.allSources]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map?.getLayer("regional-carbon")) return;
    map.setLayoutProperty(
      "regional-carbon",
      "visibility",
      mode === "carbon" ? "visible" : "none",
    );
    map.setLayoutProperty(
      "region-outline",
      "visibility",
      mode === "connections" ? "none" : "visible",
    );
    map.setLayoutProperty(
      "region-hit",
      "visibility",
      mode === "connections" ? "none" : "visible",
    );
    for (let id = 1; id <= 14; id++) {
      const region = regional?.regions.find((r) => r.id === id);
      map.setFeatureState(
        { source: "regions", id },
        {
          available: !!region,
          intensity: region?.intensity ?? 0,
          selected: id === selectedRegionId,
        },
      );
    }
  }, [mode, regional, selectedRegionId, ready]);
  return (
    <>
      <div ref={container} className="map-surface" />
      <canvas ref={canvas} className="energy-canvas" aria-hidden="true" />
      {error && (
        <div className="map-error" role="alert">
          The map could not start. {error}. Try a browser with WebGL enabled.
        </div>
      )}
    </>
  );
}
