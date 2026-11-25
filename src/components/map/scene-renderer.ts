import { sourceMarkers, type SourceMarker } from "@/lib/geo/source-map";
import {
  countryCorridors,
  geographicArc,
  projectArc,
  pointAlong,
  transferState,
  type AtlasRoute,
  type TransferDirection,
} from "@/lib/geo/quiet-atlas";
import type { Map as LibreMap } from "maplibre-gl";
import { cities, type Coast, type Point } from "@/lib/geo/scene";
import {
  settlementLights,
  sourceFuels,
  type SourceFuel,
} from "@/lib/geo/night-atlas";

export type SceneSettings = {
  playing: boolean;
  speed: number;
  wind: boolean;
  connections: boolean;
  cities: boolean;
  sourceFuel: SourceFuel;
  allSources?: boolean;
  selectedId: string | null;
  flows: Record<string, number>;
  country: string;
  direction: TransferDirection;
  stale: boolean;
};
export class SceneRenderer {
  private ctx: CanvasRenderingContext2D;
  private backdrop = document.createElement("canvas");
  private lights = settlementLights().filter((_, i) => i % 3 === 0);
  private settings: SceneSettings;
  private elapsed = 0;
  private last = 0;
  private dirty = true;
  private geometryDirty = true;
  private disposed = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private route: AtlasRoute | null = null;
  private progress = 0;
  private markers: SourceMarker[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private map: LibreMap,
    private coasts: Coast[],
    settings: SceneSettings,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.settings = settings;
    this.resize();
  }
  private project(p: Point): Point {
    const q = this.map.project(p);
    return [q.x, q.y];
  }
  private dot(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
  ) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  private glow(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
    alpha: number,
  ) {
    const gradient = c.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = gradient;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }
  resize = () => {
    const { width, height } = this.canvas.getBoundingClientRect();
    if (width < 1 || height < 1 || this.disposed) return;
    this.width = width;
    this.height = height;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.backdrop.width = this.canvas.width;
    this.backdrop.height = this.canvas.height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.redraw();
  };
  redraw = () => {
    if (this.disposed) return;
    this.dirty = true;
    this.geometryDirty = true;
    this.map.triggerRepaint();
  };
  update(settings: SceneSettings) {
    if (settings.cities !== this.settings.cities) this.dirty = true;
    if (
      settings.allSources !== this.settings.allSources ||
      settings.sourceFuel !== this.settings.sourceFuel ||
      settings.selectedId !== this.settings.selectedId ||
      settings.country !== this.settings.country
    )
      this.geometryDirty = true;
    if (
      settings.country !== this.settings.country ||
      settings.direction !== this.settings.direction
    )
      this.progress = 0;
    this.settings = settings;
    this.last = 0;
    this.map.triggerRepaint();
  }
  private landPath() {
    const path = new Path2D();
    for (const ring of this.coasts.find((c) => c.name === "United Kingdom")
      ?.rings ?? []) {
      ring.forEach((p, i) => {
        const [x, y] = this.project(p);
        if (i) path.lineTo(x, y);
        else path.moveTo(x, y);
      });
      path.closePath();
    }
    return path;
  }
  private bake() {
    const c = this.backdrop.getContext("2d")!;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    if (this.settings.cities) {
      c.save();
      c.clip(this.landPath());
      for (const [lon, lat, power] of cities) {
        const [x, y] = this.project([lon, lat]);
        const edge = this.project([lon + 0.22 * Math.sqrt(power), lat]);
        this.glow(c, x, y, Math.max(3, Math.abs(edge[0] - x)), "#f1ad65", 0.1);
      }
      for (const light of this.lights) {
        const [x, y] = this.project(light.point);
        if (x < 0 || y < 0 || x > this.width || y > this.height) continue;
        c.globalAlpha = light.brightness * 0.65;
        this.dot(c, x, y, light.radius, "#f6c786");
      }
      c.restore();
    }
    this.dirty = false;
  }
  private projectRoutes() {
    this.markers = sourceMarkers(
      this.settings.allSources ? null : this.settings.sourceFuel,
      (p) => this.project(p),
      this.width,
      this.height,
    );
    const corridor = countryCorridors.find(
      (c) => c.country === this.settings.country,
    );
    this.route = corridor
      ? projectArc(geographicArc(corridor.from, corridor.to), (p) =>
          this.project(p),
        )
      : null;
    this.geometryDirty = false;
  }
  private drawTransfer() {
    const route = this.route;
    if (!route) return;
    const c = this.ctx;
    const state = transferState(
      this.settings.flows,
      this.settings.country,
      this.settings.direction,
      this.settings.stale,
    );
    const color = this.settings.direction === "import" ? "#9ae4dd" : "#edb685";
    c.beginPath();
    route.points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.strokeStyle = color;
    c.lineWidth = 1;
    c.globalAlpha = state.active ? 0.45 : 0.16;
    c.stroke();
    c.globalAlpha = 0.7;
    for (const p of [route.points[0], route.points.at(-1)!])
      this.dot(c, ...p, 3, color);
    // Missing, partial, stale and zero readings never imply flowing power.
    if (state.active) {
      const sign = this.settings.direction === "import" ? 1 : -1;
      const head = sign === 1 ? this.progress : 1 - this.progress;
      for (let j = 9; j >= 0; j--) {
        const t = head - (sign * j * 2) / Math.max(1, route.length);
        if (t < 0 || t > 1) continue;
        c.globalAlpha = (1 - j / 10) * 0.95;
        this.dot(c, ...pointAlong(route, t), j === 0 ? 2.5 : 1.1, color);
      }
    }
    c.globalAlpha = 1;
  }
  private draw() {
    if (this.disposed || !this.width || !this.height) return;
    if (this.dirty) this.bake();
    if (this.geometryDirty) this.projectRoutes();
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    c.drawImage(this.backdrop, 0, 0, this.width, this.height);
    if (this.settings.wind) {
      this.markers.forEach((marker) => {
        const asset = marker.assets[0];
        const [x, y] = marker.screen;
        const color =
          marker.assets.length > 1
            ? "#b9d9dc"
            : (sourceFuels.find((f) => f.key === asset.fuel)?.color ??
              "#a2b9c2");
        c.save();
        c.translate(x, y);
        c.strokeStyle = color;
        c.lineWidth = 1;
        if (marker.assets.some((a) => a.id === this.settings.selectedId)) {
          c.beginPath();
          c.arc(0, 0, 16, 0, Math.PI * 2);
          c.globalAlpha = 0.35;
          c.stroke();
          c.globalAlpha = 1;
        }
        if (marker.assets.length > 1) {
          c.beginPath();
          c.arc(0, 0, 11, 0, Math.PI * 2);
          c.fillStyle = "#0d2732";
          c.fill();
          c.stroke();
          c.fillStyle = color;
          c.font = "11px Arial";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(String(marker.assets.length), 0, 0);
        } else if (asset.fuel === "wind") {
          // Plan-view rotor symbol: no upright tower or perspective offset.
          const phase = [...asset.id].reduce(
            (sum, char) => sum + char.charCodeAt(0),
            0,
          );
          c.rotate(this.elapsed * 0.35 + phase);
          for (let blade = 0; blade < 3; blade++) {
            c.rotate((Math.PI * 2) / 3);
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(asset.id === this.settings.selectedId ? 7 : 6, 0);
            c.stroke();
          }
        } else c.strokeRect(-3, -3, 6, 6);
        if (marker.assets.length === 1) this.dot(c, 0, 0, 1.3, color);
        c.restore();
      });
    }
    if (this.settings.connections && !this.settings.wind) this.drawTransfer();
  }

  /** One render clock: the overlay always uses MapLibre's displayed camera. */
  render = () => {
    if (this.disposed || document.hidden) {
      this.last = 0;
      return;
    }
    const now = performance.now();
    if (this.geometryDirty) this.projectRoutes();
    if (this.settings.playing && this.last) {
      const dt = Math.min((now - this.last) / 1000, 0.06) * this.settings.speed;
      this.elapsed += dt;
      const state = transferState(
        this.settings.flows,
        this.settings.country,
        this.settings.direction,
        this.settings.stale,
      );
      if (
        this.settings.connections &&
        !this.settings.wind &&
        state.active &&
        this.route
      )
        this.progress =
          (this.progress + dt / Math.max(4, this.route.length / 25)) % 1;
    }
    this.last = now;
    this.draw();
    const activeTransfer =
      this.settings.connections &&
      !this.settings.wind &&
      transferState(
        this.settings.flows,
        this.settings.country,
        this.settings.direction,
        this.settings.stale,
      ).active;
    if (
      this.settings.playing &&
      ((this.settings.wind &&
        this.markers.some(
          (m) => m.assets.length === 1 && m.assets[0].fuel === "wind",
        )) ||
        activeTransfer)
    )
      this.map.triggerRepaint();
  };
  visibility = () => {
    this.last = 0;
    if (!document.hidden) this.map.triggerRepaint();
  };
  destroy() {
    this.disposed = true;
  }
}
