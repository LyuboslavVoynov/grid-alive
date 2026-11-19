import { afterEach, expect, it, vi } from "vitest";
import type { Map as LibreMap } from "maplibre-gl";
import {
  SceneRenderer,
  type SceneSettings,
} from "../src/components/map/scene-renderer";

function context() {
  return {
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    measureText: () => ({ width: 45 }),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    lineTo: vi.fn(),
    strokeRect: vi.fn(),
  };
}
function setup(playing = false, width = 800) {
  const foreground = context(),
    background = context();
  let offset = 0;
  const canvas = {
    getContext: () => foreground,
    getBoundingClientRect: () => ({ width, height: 600 }),
    width: 0,
    height: 0,
  };
  const map = {
    project: (p: [number, number]) => ({
      x: 400 + p[0] * 10 + offset,
      y: 300 - (p[1] - 54) * 10,
    }),
    triggerRepaint: vi.fn(),
  };
  vi.stubGlobal("document", {
    hidden: false,
    createElement: () => ({
      getContext: () => background,
      width: 0,
      height: 0,
    }),
  });
  vi.stubGlobal("devicePixelRatio", 1);
  vi.stubGlobal(
    "Path2D",
    class {
      moveTo() {}
      lineTo() {}
      closePath() {}
    },
  );
  const settings: SceneSettings = {
    playing,
    speed: 1,
    cities: true,
    wind: true,
    sourceFuel: "wind",
    selectedId: null,
    connections: false,
    flows: {},
    country: "France",
    direction: "import",
    stale: false,
  };
  const scene = new SceneRenderer(
    canvas as unknown as HTMLCanvasElement,
    map as unknown as LibreMap,
    [],
    settings,
  );
  return {
    scene,
    settings,
    map,
    foreground,
    background,
    pan: (value: number) => {
      offset = value;
    },
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("projects the same settlement lights through a camera pan", () => {
  const { scene, background, pan } = setup();
  scene.render();
  const before = background.arc.mock.calls.map((args) => [...args]);
  background.arc.mockClear();
  pan(25);
  scene.redraw();
  scene.render();
  expect(background.arc.mock.calls).toHaveLength(before.length);
  background.arc.mock.calls.forEach((args, i) => {
    expect(args[0]).toBeCloseTo(before[i][0] + 25);
    expect(args[1]).toBe(before[i][1]);
  });
});
it("does not rebuild settlement texture for animation frames or speed changes", () => {
  const { scene, background, settings } = setup(true);
  scene.render();
  const count = background.clearRect.mock.calls.length;
  scene.render();
  scene.update({ ...settings, speed: 2 });
  scene.render();
  expect(background.clearRect).toHaveBeenCalledTimes(count);
});
it("stops requesting frames when paused, hidden or destroyed", () => {
  const { scene, map, settings } = setup(true);
  map.triggerRepaint.mockClear();
  scene.render();
  expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
  scene.update({ ...settings, playing: false });
  map.triggerRepaint.mockClear();
  scene.render();
  expect(map.triggerRepaint).not.toHaveBeenCalled();
  scene.update(settings);
  map.triggerRepaint.mockClear();
  vi.stubGlobal("document", { hidden: true });
  scene.render();
  expect(map.triggerRepaint).not.toHaveBeenCalled();
  scene.destroy();
  scene.redraw();
  expect(map.triggerRepaint).not.toHaveBeenCalled();
});
it("does not draw or copy a zero-sized canvas", () => {
  const { scene, foreground } = setup(false, 0);
  scene.render();
  expect(foreground.drawImage).not.toHaveBeenCalled();
});
it("draws no domestic grid lines and never combines source and transfer layers", () => {
  const { scene, foreground, settings } = setup();
  scene.update({
    ...settings,
    connections: true,
    flows: { INTFR: 100, INTIFA2: 0, INTELEC: 0 },
  });
  scene.render();
  expect(foreground.quadraticCurveTo).not.toHaveBeenCalled();
  // Source rotor strokes only: no route with the 65 vertices of a corridor.
  expect(foreground.lineTo.mock.calls.length).toBeLessThanOrEqual(9);
});
it("draws just one selected country corridor and reverses packet direction for exports", () => {
  const { scene, foreground, settings } = setup();
  const flows = { INTNSL: 1000, INTFR: 1000, INTIFA2: -500, INTELEC: 0 };
  const transfer = {
    ...settings,
    cities: false,
    wind: false,
    connections: true,
    flows,
  };
  scene.update(transfer);
  scene.render();
  expect(foreground.lineTo).toHaveBeenCalledTimes(64);
  const imported = foreground.arc.mock.calls.at(-1)!;
  foreground.arc.mockClear();
  scene.update({ ...transfer, direction: "export" });
  scene.render();
  const exported = foreground.arc.mock.calls.at(-1)!;
  expect(imported[0]).toBeCloseTo(400 + 1.8 * 10);
  expect(exported[0]).toBeCloseTo(400 + 1.1 * 10);
  expect(imported[0]).not.toEqual(exported[0]);
  foreground.arc.mockClear();
  scene.update({ ...transfer, stale: true });
  scene.render();
  expect(foreground.arc).toHaveBeenCalledTimes(2); // Static endpoint dots, no packet.
});
it("keeps a paused packet attached to the same geographic place during camera pans", () => {
  const { scene, foreground, settings, pan } = setup();
  scene.update({
    ...settings,
    cities: false,
    wind: false,
    connections: true,
    flows: { INTNSL: 1000 },
    country: "Norway",
  });
  scene.render();
  const before = foreground.arc.mock.calls.at(-1)!;
  foreground.arc.mockClear();
  pan(25);
  scene.redraw();
  scene.render();
  const after = foreground.arc.mock.calls.at(-1)!;
  expect(after[0]).toBeCloseTo(before[0] + 25);
  expect(after[1]).toBeCloseTo(before[1]);
});
it("does not run an idle frame loop for unavailable transfers or static carbon", () => {
  const { scene, map, settings } = setup(true);
  for (const connections of [true, false]) {
    scene.update({ ...settings, wind: false, connections, flows: {} });
    map.triggerRepaint.mockClear();
    scene.render();
    expect(map.triggerRepaint).not.toHaveBeenCalled();
  }
});
