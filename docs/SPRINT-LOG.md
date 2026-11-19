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

## V2.8 — household continuity and public tariffs (12 November 2026)

Branch codex/v2-household-continuity builds on the selection-led milestone.

- Added a root browser-memory workspace for region, tariff, task draft, validated readings and saved windows. Internal navigation preserves it; reload/close clears unsaved data. Remember remains opt-in, existing saved workspaces migrate, and clear resets the shared state.
- Region selection pre-fills tariff setup and follows users into the planner. Exploring another carbon region does not silently change the tariff's regional prices; a visible message explains any difference.
- Expanded the public catalogue to validated ordinary Octopus Agile/Flexible/fixed, Co-op Flexible/fixed and London Power Flexible plans. Live checks returned eight currently supported offers. Product direction is checked against the catalogue; product detail's missing direction is handled from that already-validated source. Direct-debit and varying code structures are supported; non-DD and conflicting price intervals are excluded/rejected.
- Public tariffs with product metadata refresh at most every five minutes while visible, with delayed-state messages on failure. The planner advances its clock each minute while visible so past start windows fall away. Saved windows remain labelled saved estimates.
- Added local CSV column selectors, three-row preview, interval-energy confirmation and explicit Wh/kWh conversion. Known headers auto-map; unfamiliar headers require no file editing. Existing readings are kept until a replacement succeeds. Raw files/previews never upload or persist.
- Validation: 54 tests, TypeScript and optimized build pass. New tests cover supported/excluded families, catalogue paging bounds, payment methods, actual Flexible response structure, CSV mapping/units, legacy storage and task-draft migration.
- Browser: London selection carried from Your area into the planner; Co-op Flexible loaded, and remained selected after visiting Britain and returning. Changing the carbon region left London household prices intact. Synthetic unfamiliar-header CSV values of 500 Wh and 750 Wh imported as 1.25 kWh, survived internal navigation, and task amounts survived tab changes. Mobile review at 390px found no horizontal overflow in tariff setup or CSV mapping. A cancelled-request catalogue warning was fixed and rechecked after reload; no console errors remained.
- Personal meter authorisation is still unconfigured. Public tariff selection never grants consumption access. No account, credentials, deployment or background push service was added.

### Night Atlas landing and source motion — 15 November 2026

Branch `codex/night-atlas-power-flow`, based on the existing local household-continuity branch. Implemented the approved flat night-atlas direction with warm geographic settlement artwork, restrained coastlines, top-down rotors, clear directional packet trails, renewable-source/site selectors and national observation summaries. The full generation mix remains available, including gas/nuclear and explicit missing solar output. Selected-site capacity and dated metadata are separate from national observations; source paths are labelled schematic and site output unavailable. No new API keys, personal inputs, hosting or deployments.

Replaced independent canvas animation timing with MapLibre render-event drawing, geographically anchored light points and cached static texture. Added focused regression coverage for stable lights during pan, pause/hidden/destroy lifecycle, no texture rebakes during animation/speed changes, zero-size surfaces, selected-site route origins and independence from installed capacity. Browser QA covers desktop and narrow layouts, solar missing data, long site labels and matching map/overlay bounds. Verification details are recorded in docs/QA.md.

### Regional Balance single-page consolidation — 16 November 2026

Branch `codex/regional-balance-single-page`. Implemented the selected Regional Balance layout: region selector, national/regional headline context, one flat selectable map and persistent generation split. Demand, forecast/replay, named generating sites, tariff/task/annual/usage/plan tools, display settings and methodology open in accessible native dialogs. Household state remains in the root provider across pop-ups. Old area/home/methodology URLs have lightweight redirects to root-page tools.

Removed the previous GridApp/AreaApp/HomeApp/Workspace/navigation controllers, the obsolete standalone dist prototype, typed-postcode/geocoder APIs and unused data fields, and replaced page-specific/night-atlas styling with the shared-tool and Regional Balance styles. Kept the active renderer, licensed geometry/data, data adapters, privacy controls and household calculations. Extracted annual cost comparison as a shared component. No live regional MW values are invented: modelled supply percentages and clearly labelled GB demand context are displayed.

Checks: 67 tests pass; TypeScript also passes noUnusedLocals/noUnusedParameters. Browser checks confirm regional selection, matching map/canvas bounds, modal dismissal and focus restoration, task choices across reopen, and the unchanged annual cost scenario. Further local verification is recorded in docs/QA.md. No deployment or account changes.

### Interactive generation ring and country flows — 16 November 2026

Branch `codex/country-flows-generation-ring`, following the approved interaction direction. Replaced the generation bar with a keyboard/touch/hover ring, animated selected-source icons, explanations and renewable map selection. Added a compact GB import-country strip plus country cards with independent gross imports/exports, shares of inward transfers, individual cable details and 24-hour net-transfer trends. Country scope remains GB-wide when a regional mix is selected.

Consolidated cable metadata and expanded the map from four to ten schematic links. Positive/negative observations drive direction, mint/amber styling and bounded absolute-MW widths. Retired the old transfer list and stack styles. Missing readings remain unavailable, unrecognised codes remain unmapped, and opposite-direction cables never cancel out of gross totals. All 71 tests, unused-code TypeScript checks and production build pass; desktop/mobile/narrow browser evidence is in docs/QA.md. Local only; no extra API keys or account changes.

### Mobile overview redesign — 16 November 2026

Branch `codex/mobile-overview-design`. Replaced the phone's map-first vertical stack with compact demand/carbon cards, source ring beside touch-sized fuel buttons, country cards, a fixed five-item tool bar and More menu. The default mobile page has no map canvas. Explore map is optional and lazily imports the map component; full-width native sheets hold map and other tools. National generation totals remain in the mobile supply caption; regional shares and GB demand context remain distinct.

Adapted generating-site focus, international-flow navigation and replay to open the optional map. Deferred focus survives initial load/resize; closing destroys the map and clears controls. Removed the superseded imperative focus control and old phone layout rules. Hover selection is restricted to desktop pointer layouts, preventing mobile source changes caused by incidental mouse events. Development indicator no longer overlaps the bottom navigation. Existing privacy/workspace controls remain intact; no API, account or deployment changes. Browser and check evidence is in docs/QA.md.

### Shared interaction motion — 16 November 2026

Branch `codex/interaction-motion`. Added a restrained interaction language across desktop and mobile: control press/hover/focus, keyboard feedback, selected navigation, field feedback, chart/result and source changes, native disclosure expansion, desktop dialog entrances and phone sheet entrances. Internal household-tool navigation also animates and moves focus to the selected tab when its action removes the previous focused control. No animation package or provider changes.

Dialog exit now retains the last committed view while the native modal stays active, then releases body scrolling, unmounts tool content and restores opener focus (or region selection if the opener has gone). Pending dismissals can be cancelled; fallback completion avoids a stuck modal when an animation API fails. Reduced-motion and hidden-page paths bypass dismissal animation. Hover feedback is restricted to appropriate pointers, and map surfaces never scale during transitions. Added five regression checks for completion, cancellation, dropped animation promises and reduced-motion/unavailable APIs. All 76 tests, unused-code TypeScript checks and production build pass. Detailed timing is in docs/INTERACTIONS.md; browser evidence is in docs/QA.md. Local only.

### Quiet Atlas and animation integrity — 17 November 2026

Branch `codex/quiet-atlas-map`. Implemented the approved quiet map direction: separate Sources, Imports & exports, and Regional carbon views; up to three screen-spaced source markers; slower plan-view rotors with stable per-site phases; reduced-density geographic settlement lights; details on selection. Removed the full-inventory dot layers, invented domestic junctions/paths, per-cable control points, magnitude widths, permanent canvas labels and their obsolete styles/helpers.

International motion follows one selected country corridor, with explicit import/export selection and both gross totals retained. The selected corridor uses representative grid anchors, not surveyed cable routes. A single projected polyline drives both stroke and packet positions; distance sampling avoids uneven motion, while normalized progress survives camera changes. Missing, partial, zero and stale readings suppress packets. Drawing and hit testing share one visible marker set. Resize preserves user camera position; reset/refitting includes Shetland, and mobile transfer framing leaves room for controls/details. Static views do not keep an animation loop running.

All 82 tests across 19 files, unused-code TypeScript checks and optimized production build pass. Desktop and mobile browser review is recorded in docs/QA.md. Local only; no provider, credential, account or hosting changes.

### Generation split controls the map — 18 November 2026

Branch `codex/source-linked-map`. Replaced the generation ring with labelled source tiles and proportional share meters. A click/keyboard activation selects the source, updates the map heading, fits its recorded sites and synchronizes the selected tile. Hover and focus no longer change the selection. Removed map View/Site/Country/Direction dropdowns and retired their styles/helpers; source directory uses buttons and named records. All-source reset is one action. Demand is the first national metric and remains visible on mobile.

Imported all 49 natural-gas, five nuclear and 14 diesel/gas-oil GB Major Power Producer records from DESNZ DUKES 5.11 (May 2026). Retained 105 featured REPD renewable records, for 173 records total. The reproducible offline import validates source coordinates and stable site codes; it does not geocode, guess sites, allocate national output or claim current operation. The in-app source/methodology text states the limited register coverage and dated operational status.

Replaced the three-site cap with deterministic screen-space groups shared by canvas symbols and accessible native 44px buttons. Groups zoom in; co-located records such as Heysham 1/2 expose a named list with focus transfer. Country import/export buttons directly select the signed corridor, preserve gross directions and clear source markers. Missing/zero/stale transfer motion rules remain. Unknown source categories show no matched locations instead of retaining a previous fuel's sites.

Mobile fuel/country choices open the optional map sheet; the mobile overview remains map-free and closes/reclaims the map. No new runtime dependency, key, account access or deployment. All 85 tests across 20 files, unused-code TypeScript checks and production build pass. Browser evidence is in docs/QA.md.
