/** Offline input preparation, not a production network request. See docs/DATA-SOURCES.md. */
import { readFile, writeFile } from "node:fs/promises";
import proj4 from "proj4";
const bng =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs";
const convert = (p) => proj4(bng, "EPSG:4326", p).map((x) => +x.toFixed(5));
if (process.argv[2] === "assets") {
  const raw = JSON.parse(await readFile("/tmp/grid-assets-bng.json", "utf8"));
  const assets = raw
    .map(({ bng, ...asset }) => ({
      ...asset,
      point: convert(bng),
      source: "DESNZ REPD July 2026",
      status: "Operational (source snapshot)",
    }))
    .filter(
      (x) =>
        x.point[0] > -9 && x.point[0] < 4 && x.point[1] > 49 && x.point[1] < 61,
    );
  await writeFile(
    "data/renewable-assets.json",
    JSON.stringify(assets, null, 2) + "\n",
  );
  console.log("Prepared", assets.length, "assets");
}
if (process.argv[2] === "regions") {
  const raw = JSON.parse(await readFile("/tmp/grid-dno.json", "utf8"));
  const regionIds = {
    _A: 10,
    _B: 9,
    _C: 13,
    _D: 6,
    _E: 8,
    _F: 4,
    _G: 3,
    _P: 1,
    _J: 14,
    _K: 7,
    _L: 11,
    _M: 5,
    _N: 2,
    _H: 12,
  };
  function simplify(r, tolerance = 400) {
    if (r.length < 3) return r;
    const a = r[0],
      b = r.at(-1),
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      den = dx * dx + dy * dy;
    let max = 0,
      index = 0;
    for (let i = 1; i < r.length - 1; i++) {
      const p = r[i],
        t = den
          ? Math.max(
              0,
              Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den),
            )
          : 0;
      const distance =
        (p[0] - a[0] - dx * t) ** 2 + (p[1] - a[1] - dy * t) ** 2;
      if (distance > max) {
        max = distance;
        index = i;
      }
    }
    return max > tolerance * tolerance
      ? [
          ...simplify(r.slice(0, index + 1), tolerance).slice(0, -1),
          ...simplify(r.slice(index), tolerance),
        ]
      : [a, b];
  }
  const features = raw.features.map((f) => {
    const polys =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    const coordinates = polys
      .map((poly) =>
        poly
          .map((r) => {
            const s = simplify(r);
            return s.length >= 4 ? s.map(convert) : null;
          })
          .filter(Boolean),
      )
      .filter((poly) => poly.length);
    return {
      type: "Feature",
      properties: {
        regionId: regionIds[f.properties.Name],
        name: f.properties.Area,
      },
      geometry: { type: "MultiPolygon", coordinates },
    };
  });
  await writeFile(
    "public/geo/regions.json",
    JSON.stringify({ type: "FeatureCollection", features }),
  );
  console.log("Prepared", features.length, "regions");
}
