/** Offline conversion of the unmodified official coordinate fields, not geocoding. */
import { readFile, writeFile } from "node:fs/promises";
import proj4 from "proj4";
const bng =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs";
const rows = JSON.parse(await readFile(process.argv[2], "utf8"));
const records = rows.map(({ bng: point, ...record }) => ({
  ...record,
  point: proj4(bng, "EPSG:4326", point).map((n) => +n.toFixed(5)),
}));
if (
  records.some(
    (r) =>
      r.point.some((n) => !Number.isFinite(n)) ||
      r.point[0] < -9 ||
      r.point[0] > 3 ||
      r.point[1] < 49 ||
      r.point[1] > 61,
  )
)
  throw Error("Invalid converted station coordinate");
await writeFile(
  "data/power-stations.json",
  JSON.stringify(records, null, 2) + "\n",
);
console.log("Prepared", records.length, "station locations");
