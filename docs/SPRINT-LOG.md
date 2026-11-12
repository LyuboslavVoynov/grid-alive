# Delivery log

## Sprint 1 — foundation

- Created a Next.js App Router application with React, TypeScript and modular map/scene components.
- Bundled public-domain coastlines and MapLibre workers. No external basemap service.
- Flat north-up view, geographic pan/zoom/reset, keyboard navigation and touch zoom with rotation disabled.
- Preserved the approved night-map design and responsive generation drawer.
- Added location details that explicitly describe current markers as illustrative.
- Reduced-motion defaults to paused; animation avoids React updates per frame and suspends when the page is hidden.
- Added sources/methodology page and GitHub build/typecheck workflow.
- Verification: TypeScript and production build passed. Browser preview confirmed coastlines, city lights and playback/zoom controls. Repaired the MapLibre module worker path found during browser QA.
- Real data: none yet. All displayed energy figures remain labelled sample data; asset positions and flow paths are illustrative.

## Sprint 2 — live observations

- Integrated timestamped Elexon FUELINST and INDO and NESO carbon intensity via server-side adapters.
- Generation percentages exclude imports and pumped storage; gas combines CCGT/OCGT. Solar is explicitly not reported, rather than invented or mixed with an incompatible estimate.
- All observations retain source, units through their typed metric, coverage, quality, reporting interval, publication time when supplied, retrieval time and freshness.
- Added schema validation, finite-number checks, revision handling, partial-snapshot rejection, bounded retries and a deduplicating process-local cache with labelled stale fallback.
- Replaced production sample figures with real observations; each metric shows its own time. Added methodology and outage/partial-data states.
- Verification: 10 tests cover accounting, unknown fuels, revisions, gaps, zero-carbon estimates, negative values, cache fallback and cold-start failure. TypeScript passed. The local API returned actual provider observations with no errors during integration.
- Remaining: turbine locations remain illustrative; regional carbon and historical replay are later milestones.

## Sprint 3 — geographic assets and observed activity

- Replaced demonstration asset locations with 105 selected operational renewable projects from DESNZ REPD July 2026; excluded Northern Ireland and retained source IDs, capacity, country and dated status.
- Added source-coloured geographic markers, mouse selection and a keyboard-accessible site picker. Site panels separate installed capacity from unavailable measured output.
- Added stylised offshore turbines at real site reference points and explicitly illustrative particle paths; national wind share controls path activity.
- International paths use Elexon link observations and preserve import/export signs; schematic routes do not claim surveyed terminal locations.
- Documented licences, coverage, approximate coordinate conversion and geographic preparation in docs/DATA-SOURCES.md.
- Prepared NESO DNO boundaries for the next milestone and tested the mapping to all fourteen Carbon Intensity region IDs.
- Verification: 12 unit tests and TypeScript pass. Geographic tests cover unique IDs, GB coverage, valid coordinates and closed regional polygons.

## Sprint 4 — regional carbon and replay

- Connected all fourteen NESO regional forecasts/modelled estimates to approximate licensed DNO boundary geometry; included a numerical legend and accessible region-value list.
- Added flow/carbon/connections modes and a measured interconnector list with timestamps, units and direction.
- Implemented a bounded 24-hour historical endpoint using signed Elexon FUELINST, INDO and NESO national/regional data; the timeline uses half-hour observation steps.
- Scrubbing changes generation, demand, carbon, regions and interconnector observations together. Missing intervals are unavailable; current observations are not substituted. Return-to-latest restores the latest feed.
- Added tests for interval edges, unique regional coverage, zero-intensity values, bounded cache fallback and the GMT/BST repeated-hour distinction.
- Verification: 16 unit tests and TypeScript pass. Production build passed. Local endpoints return 14 regions and 48 replay frames. Browser checks confirmed carbon colouring, mobile generation expansion, scrubbing to the prior day and restoring latest values. Fixed a stale development-module export by restarting the preview.

## Sprint 5 — launch preparation (deployment pending)

- Reduced particle projection work by projecting curve control points once per path, rather than once per trail particle.
- Adapts procedural texture density to viewport area; animation pauses when hidden and honors reduced motion.
- Added dismissible information overlays, focus treatment and larger touch targets.
- Documented deployment, observation cache limits, operational checks, rollback and geographic refresh.
- Public deployment requires the owner's hosting connection; Vercel integration has been offered. No hosting configuration or paid plan has been changed.

- Final local hardening: 18 tests, typecheck and build pass. Added an integration test demonstrating that future generation and old demand are never substituted into a selected historical period. Full provider outages retain explicit unavailable layers. See docs/QA.md for checks and limits.

## Owner decision — local review

Keep the application local for now. Public deployment is intentionally deferred, not blocked on a connection. Do not initiate hosting setup or deployment unless the owner resumes that work. Production-mode local smoke checks returned HTTP 200 for the application, methodology, map worker and all three data APIs, including 14 regions and 48 historical periods with no gaps.

## V2 storyboard build — 11 November 2026

Owner approved the complete storyboard and instructed sequential delivery. All implementation remains local; no hosting account or deployment was touched.

| Sprint | Local branch | Outcome |
| --- | --- | --- |
| V2.1 | codex/v2-01-navigation | Approved scope and acceptance criteria; three main destinations and responsive product shell. |
| V2.2 | codex/v2-02-britain-insights | Observed demand comparison, timestamped frequency, published demand/wind/carbon forecasts, selected REMIT availability context. |
| V2.3 | codex/v2-03-local-insights | Outward postcode regional modelled mix/carbon, nearest featured sites, 350 authorities of official 2024 domestic/non-domestic consumption. |
| V2.4 | codex/v2-04-cost-planner | Manual single/two-rate tariff, public Agile direct-debit import, separate APXMIDP wholesale context, complete-coverage task cost and carbon comparisons. |
| V2.5 | codex/v2-05-home-usage | Private CSV readings, daily/week analysis, baseline, annual comparison scenarios, saved windows, calendar export, opt-in in-page reminders and browser storage. |
| V2.6 | codex/v2-06-integration-qa | Format, calculation/data tests, source and privacy documentation, production build, real API smoke tests and browser QA; fixed zero-size canvas redraw on route changes and clear-workspace form reset. |

Validation: 33 tests, TypeScript and production build pass. Browser checks include desktop navigation, manual 30p/10p task arithmetic, live Agile import, separate carbon windows and saving to plan, a synthetic 336-reading CSV (14.8 kWh/day, £3.93 energy, £0.50 standing, 300 W median overnight), 390px responsive map/home/area layouts and no horizontal document overflow. A fresh browser session after the map resize fix reported no console errors.

Live server smoke results: 96 observed demand points, 73 published demand forecast points, 48 wind forecast points, 96 national carbon points, four parsed REMIT messages, postcode SW1A/London with 96 regional intervals and two intersecting authorities, 48 market index points, current Agile public rates. Counts vary with provider publication. Tests cover annual source reconciliation, revisions, forecast expiry, postcode validation, missing prices, negative prices, DST and CSV invalid/overlapping/future intervals.

Limits: authenticated meter linking is not configured; file import is the supported personal-data path. No closed-page push service; calendar export and in-page reminders are provided. Tariff provider import supports public Agile/direct-debit import only. Unit output remains unavailable where no matched observation exists; notices are not measured output. No exhaustive grid outage feed, detailed live sector consumption or guaranteed savings. These limitations are visible in product copy and methodology.

## V2.7 — selection-led journey (12 November 2026)

Owner clarified: use selection controls wherever possible for location, supplier, tariff and tasks. Branch codex/v2-selection-first builds on the previous v2 sprint chain.

- Region selection replaces postcode entry in Your area and the planner. NESO lookup uses a validated region ID; no address or geocoder is needed. Project distances are explicitly measured from the approximate regional map centre.
- Supplier choice and published tariff version are primary. Human-readable electricity regions resolve to exactly one published tariff code. Public Agile import is supported; other suppliers remain explicitly unavailable for automatic prices, with optional exact bill-rate entry.
- Task energy/duration and annual scenario assumptions use dropdown presets. Optional disclosures allow exact values. Presets are examples, never personal measurements or actual supplier offers.
- Without a tariff, users can plan forecast carbon windows; household cost stays unknown and no price saving is invented. Selecting a supplier does not grant access to personal meter readings.
- Validation: 38 tests, TypeScript and production build pass. Added region/schema/request tests, geographic/tariff mapping checks and missing-tariff carbon arithmetic. Test configuration resolves the application's source alias.
- Browser: selected Octopus / Agile version / London and loaded live prices without typing; selected an EV example, energy, duration and carbon region; selected London regional insights without a postcode; verified carbon-only planning and a 2500 kWh / 25p / 50p hypothetical annual scenario (£807.50). Desktop and 390px checks show no document overflow. Main controls expose zero visible textboxes or numeric-entry fields unless optional exact-value sections are opened. No console errors in the reviewed session.
- Local-only remains in force. No account connection, API-key field, hosted deployment or notification service was introduced.
