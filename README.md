# GRID / ALIVE

A cinematic, top-down view of Great Britain's electricity system. Public website, no sign-in. The approved v2 adds regional exploration, household tariffs, task planning and private usage analysis. Keep local; no hosting deployment.

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

Coastlines: Natural Earth 1:10m countries, simplified for this viewport; public domain. https://www.naturalearthdata.com/about/terms-of-use/ . City lights are procedural artwork, not satellite imagery or power-grid routes. Selected renewable sites use the dated DESNZ REPD July 2026 snapshot. Installed capacity is not live output; turbine symbols and paths remain illustrative. Regional carbon forecasts use approximate NESO DNO boundaries. Replay covers the preceding 24 hours in 48 half-hour steps with real historical observations and visible gaps.

See [the build plan](docs/BUILD-PLAN.md) for branches, sprint acceptance criteria and access decisions. Use the connected GitHub app for repository writes; do not change the local CLI account.


## V2 product views

- Britain: live supply, demand trends, timestamped frequency, published demand/wind/carbon forecasts and selected REMIT notices.
- Your area: region selection, modelled regional mix/carbon, featured projects around the regional map centre and official 2024 local consumption.
- Your home: supplier/tariff/region selection for supported public tariff import, optional exact bill rates, household task cost/carbon planner, local CSV readings, daily/week usage, baseline insight, explainable actions and annual tariff scenarios.

Personal readings never upload to the server. The workspace is in memory unless the visitor opts into browser-local storage. Download an empty CSV template in My usage; accepted columns are interval_start, interval_end, consumption (kWh), with explicit-offset ISO timestamps and aligned half-hour intervals. Authenticated supplier meter linking is not configured: file import is the supported personal-data path. Calendar downloads and in-page reminders work without notification services; there are no closed-page push alerts or appliance controls.

No API keys required for current features. Public tariff integration supports selected Octopus Energy Agile/Flexible/fixed, Co-op Flexible/fixed and London Power Flexible plans, for direct-debit single-register import only. Personalised rewards, smart charging schedules and export plans are excluded. Calculations never fill unpublished prices or missing readings with zero. Wholesale context is separate from household rates. See docs/DATA-SOURCES.md and /methodology for assumptions.


## Selection-led setup

The main journey uses selection controls: electricity region, supplier, supported tariff version, task, energy/duration presets and annual comparison assumptions. No postcode, tariff code or API key is required. Numeric presets are explicitly illustrative assumptions, not personal measurements or supplier quotes. Exact values remain available in optional disclosures, and local CSV import remains a file-picker action.

Without a supported tariff, task windows can still be compared by forecast carbon. Household prices and savings remain unknown. Region lookup calls NESO directly by its published region ID and uses the approximate DNO bounding-box centre for map focus and nearby-project context, not a user's location. Public supplier selection supports a limited, validated set of published tariffs; it does not authorise personal meter access.


## Household continuity and CSV mapping

Region, tariff, task choices, imported readings and saved windows stay in browser memory while navigating the app. Reloading/closing clears them unless Remember is enabled. Existing saved workspaces migrate without requiring new fields. A selected forecast region never silently changes the tariff's regional price. Public tariffs with product metadata refresh at most every five minutes while the page is visible; failures show a delayed-data notice and keep uncovered periods unknown.

CSV files with unfamiliar headers can be matched through column selectors. Choose start, end, interval energy and kWh/Wh; Wh is converted to kWh. Explicit-offset timestamps and aligned half hours remain mandatory, and the visitor confirms that values represent interval energy rather than cumulative meter totals. Files, previews and parsing stay in the browser. Selecting a supplier still does not connect a personal meter.
