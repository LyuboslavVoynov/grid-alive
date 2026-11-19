import { countryTransfers } from "./interconnectors";
import type { Point } from "./scene";

/** Representative grid anchors, NOT surveyed cable landfalls or cable paths. */
export const countryCorridors: { country: string; from: Point; to: Point }[] = [
  { country: "France", from: [1.8, 50.9], to: [1.1, 51.1] },
  { country: "Norway", from: [6.7, 59.5], to: [-1.5, 55.1] },
  { country: "Denmark", from: [8.3, 55.6], to: [0, 52.9] },
  { country: "Netherlands", from: [4, 52], to: [0.7, 51.5] },
  { country: "Belgium", from: [3.2, 51.3], to: [1.3, 51.3] },
  { country: "Ireland", from: [-6.2, 53.5], to: [-3.5, 53.2] },
  { country: "Northern Ireland", from: [-5.8, 54.9], to: [-4.9, 55.1] },
];
export type TransferDirection = "import" | "export";
export function transferState(
  flows: Record<string, number>,
  country: string,
  direction: TransferDirection,
  stale: boolean,
) {
  const group = countryTransfers(flows).find((g) => g.country === country);
  const mw = group
    ? direction === "import"
      ? group.importsMw
      : group.exportsMw
    : 0;
  const complete = !!group && group.missing === 0;
  return { group, mw, active: !stale && complete && mw > 0, complete };
}
/** Sample one geographic great-circle arc before projection. No arbitrary curve handles. */
export function geographicArc(from: Point, to: Point): Point[] {
  const rad = Math.PI / 180;
  const vector = ([lon, lat]: Point) => [
    Math.cos(lat * rad) * Math.cos(lon * rad),
    Math.cos(lat * rad) * Math.sin(lon * rad),
    Math.sin(lat * rad),
  ];
  const a = vector(from),
    b = vector(to);
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        a.reduce((sum, v, i) => sum + v * b[i], 0),
      ),
    ),
  );
  if (angle < 1e-8) return [from, to];
  return Array.from({ length: 65 }, (_, i) => {
    if (i === 0) return from;
    if (i === 64) return to;
    const t = i / 64,
      x = Math.sin((1 - t) * angle) / Math.sin(angle),
      y = Math.sin(t * angle) / Math.sin(angle);
    const v = a.map((n, j) => n * x + b[j] * y);
    return [
      Math.atan2(v[1], v[0]) / rad,
      Math.atan2(v[2], Math.hypot(v[0], v[1])) / rad,
    ] as Point;
  });
}
export function projectArc(points: Point[], project: (p: Point) => Point) {
  const projected = points.map(project),
    distances = [0];
  for (let i = 1; i < projected.length; i++)
    distances.push(
      distances[i - 1] +
        Math.hypot(
          projected[i][0] - projected[i - 1][0],
          projected[i][1] - projected[i - 1][1],
        ),
    );
  return { points: projected, distances, length: distances.at(-1) ?? 0 };
}
export type AtlasRoute = ReturnType<typeof projectArc>;
/** Constant distance along the same polyline used for the visible stroke. */
export function pointAlong(route: AtlasRoute, progress: number): Point {
  const distance = Math.max(0, Math.min(1, progress)) * route.length;
  const i = Math.max(
    1,
    route.distances.findIndex((d) => d >= distance),
  );
  const a = route.points[i - 1],
    b = route.points[i] ?? a;
  const segment = route.distances[i] - route.distances[i - 1];
  const t = segment ? (distance - route.distances[i - 1]) / segment : 0;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
