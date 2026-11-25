# GRID / ALIVE

Regional Balance: one public page for Britain's electricity mix, national demand context and household energy tools. The flat animated map and generation split stay together; detailed functions open in pop-ups. No sign-in. Keep local; no hosting deployment.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Open http://127.0.0.1:3000. The install hook prepares the locally served MapLibre worker. No paid tiles, map-service account or API key is required for current public-data features.

## One page, contextual tools

Select Great Britain or one of fourteen electricity regions. Desktop keeps the map beside the generation split. On phones (700px and narrower), the landing page uses compact demand/carbon cards, a source ring beside touch-sized fuel choices, a country strip and fixed bottom navigation. The map is an optional sheet from Explore map or More, and its component/renderer only loads when requested. Tools open in native dialogs and restore focus on closing:

- Supply: the full regional modelled mix or national metered generation; international transfers and storage stay separate.
- Demand: national trends and separately selected annual local-authority consumption.
- Forecast: regional carbon, national demand/wind/carbon outlook, selected REMIT context and 24-hour historical replay.
- Power sources: featured renewable-site locations, technology and installed capacity, with current site output unavailable.
- Energy tools: public tariff selection, optional exact rates, task planning, annual cost scenarios, local CSV usage and saved plans/calendar exports.
- About/display: map layers, lights, flow, motion speed and frequency context. Source definitions and privacy open in their own pop-up.

Only `/` is an application UI page. Older `/area`, `/home` and `/methodology` URLs redirect to the matching pop-up, including compatible legacy query parameters. The replaced page controllers, navigation, unused postcode/geocoder lookup, old styling and standalone `dist/` prototype have been removed. Static design references remain under `design/`.

## Data integrity

The connected regional feed supplies modelled fuel percentages and carbon forecasts, not live regional generation or demand in MW. The page labels GB demand as national context when a region is selected. It never allocates national totals to a region, station or household. Regional imports and embedded generation remain part of the regional model; national metered generation has different coverage. Solar is unreported nationally by the chosen metered feed and can still appear in the regional model.

Each observation retains its own timestamp, quality and freshness. Missing values remain unavailable; there are no sample-data fallbacks. Historical replay uses real snapshots in 48 half-hour steps. Archived regional carbon and national totals are separate from regional fuel mix, which is unavailable in the archive.

Coastlines are public-domain Natural Earth geometry. Approximate regional boundaries come from NESO. City illumination and domestic power routes are artwork. Selected sites use the dated DESNZ REPD July 2026 snapshot; capacity and operational status are dated metadata, not live output. Rotor speed and packet density do not encode site output. International direction uses signed link observations on schematic paths.

## Private household workspace

Region, tariff, task choices, readings and saved windows stay in memory across pop-ups. Reloading or closing clears unsaved state. Browser-local persistence is opt-in. Imported CSV files, column previews and parsing remain in the browser; personal readings are never uploaded. File import is the supported personal-meter path; authenticated supplier linking is not configured.

Primary controls use selections for region, supplier, supported tariff, tasks and numeric assumptions. Optional exact values refine them. Public tariff selection does not switch supplier or grant meter access. Published rate gaps remain unknown. Without a tariff, carbon planning still works while household cost and savings remain unknown. Calendar exports and in-page reminders do not control appliances or send closed-page push notifications.

See [data sources](docs/DATA-SOURCES.md), [verification](docs/QA.md), [build history](docs/SPRINT-LOG.md) and [future deployment notes](docs/DEPLOYMENT.md). Use the connected GitHub app for repository writes; do not change the local CLI account.

### Country transfers and interactive mix

The generation split is a keyboard/touch/hover source ring with selected-source icons and explanations. Renewable selections highlight featured map sites; this does not establish their measured output. The border strip opens country cards with gross imports/exports, import shares, cable detail and 24-hour net-transfer trends. France and Ireland group their cables; Northern Ireland remains a distinct connected system. Missing readings are not zero; unknown codes remain unmapped. The country view always describes GB transfers, independently of the selected regional modelled import share.

Ten schematic international paths now use one shared cable metadata map. Signed observations determine direction; mint/amber distinguish imports/exports and bounded line width reflects absolute MW. Domestic paths and motion speed remain illustrative. No new provider credentials or deployment.

### Mobile overview

Mobile keeps region selection, source selection and household tools on the same page. Full-width sheets replace narrow floating pop-ups; the bottom bar opens demand, forecast, savings and usage. More includes named generating sites, country transfers, methodology and display settings. Show site on map and Follow transfers open the optional map sheet, with deferred site focus applied after map load/resize. Closing the map destroys its renderer and clears its controls. Desktop and phone resize transitions never keep a hidden map running. Source hover preview is limited to hover-capable desktop widths; touch and keyboard selection remain explicit.

### Interaction motion

Shared press/hover/focus feedback covers controls, selectors, tabs, links and disclosures. Desktop dialogs fade/lift; phone sheets slide in. Exiting dialogs retain their content and native focus trap until completion, then unmount tools and restore scrolling/focus. Tool panels and source explanations transition without resetting drafts for animation. Reduced-motion preferences remove the effects. See [the interaction design](docs/INTERACTIONS.md) for timing and behaviour.
