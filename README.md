# GRID / ALIVE

A cinematic, top-down view of Great Britain's electricity system. Public website, no sign-in. Prices are outside the initial release.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. `npm run typecheck` checks TypeScript and `npm run build` creates the production application. The install hook prepares the locally served MapLibre worker; no map service account, paid tiles, or map API key is needed.

## Current milestone

Next.js/React/TypeScript foundation, MapLibre flat map with pan/zoom/reset and keyboard/touch controls, procedural city illumination, illustrative turbines and particle paths, layer toggles, pause/speed controls and reduced-motion support. The production application reads real Elexon metered generation, demand and interconnector observations, and NESO carbon estimates. It never falls back to sample values. Solar is shown as not reported because the selected metered feed does not separately report it. The standalone study remains illustrative.

The approved standalone motion study remains in `dist/` and can be served with `python3 -m http.server 4173 --directory dist`.

## Data integrity

Never present fixtures as live measurements. Generation totals and shares must use compatible intervals and coverage; imports and storage are separate. Every observation tracks source, reporting time, retrieval time, quality and freshness. Individual asset output and physical network flows must not be inferred from national data.

## Geography

Coastlines: Natural Earth 1:10m countries, simplified for this viewport; public domain. https://www.naturalearthdata.com/about/terms-of-use/ . City lights are procedural artwork, not satellite imagery or power-grid routes. Selected renewable sites use the dated DESNZ REPD July 2026 snapshot. Installed capacity is not live output; turbine symbols and paths remain illustrative. Regional carbon forecasts use approximate NESO DNO boundaries. Replay covers 24 complete half-hour periods with real historical observations and visible gaps.

See [the build plan](docs/BUILD-PLAN.md) for branches, sprint acceptance criteria and access decisions. Use the connected GitHub app for repository writes; do not change the local CLI account.
