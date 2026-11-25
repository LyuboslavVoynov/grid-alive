# Verification record — 11 November 2026

## Automated checks

18 tests cover generation accounting (imports/storage excluded from shares), known and unknown fuel categories, revisions, negative values, incomplete observations, historical gaps, zero carbon values, estimated/forecast quality, cache deduplication/stale fallback/cold start/expiry, geographic ID and coordinate integrity, region mappings, time-zone ambiguity, synchronized history and full provider outage.

TypeScript and production build passed through each completed milestone. GitHub checks passed before merging PRs #7, #8, #9 and #10.

## Browser checks performed

Desktop and a 390 × 844 mobile viewport in the in-app browser:

- Map worker loads locally and coastlines render; the map remains flat and north-up.
- Pan/zoom/reset and playback controls are available; pause changes visible state.
- Source observations replace placeholders, with distinct source times.
- Carbon mode displays regional fills, a numerical legend and a text value list.
- Historical scrubbing to the previous day changes the header date, generation shares and carbon observation; Now restores latest observations.
- Mobile generation details expand; browser viewport override was reset afterwards.

## Limits and remaining release checks

- No public deployment has occurred. Production hosting connection and deployed API reachability remain unverified.
- No measured FPS claim is made. Rendering reduces particle projection work, caps device pixel ratio and density, and suspends hidden-page animation; representative physical mobile-device profiling remains a launch check.
- Cross-browser checks outside the in-app browser have not been performed. Reduced-motion behavior is implemented through the browser media query but has not been exercised with a changed OS preference in this session.
- Geographic reference coordinates are approximate and inventory coverage is intentionally selected, not comprehensive. Individual site output is not provided.
- Process-local caching is not durable across server restarts or shared across instances; cold-start provider outages show unavailable data.

## V2 integration evidence — 11 November 2026

- 33 unit/data tests pass; TypeScript and Next.js optimized build pass.
- Browser desktop and 390 × 844 narrow view: route navigation, tariff form, task planner, supply/demand/outlook, regional postcode and personal usage. Narrow views have no horizontal document overflow; map pitch remains locked at zero.
- Synthetic QA CSV only (outside repository and never a default): 336 half-hour records imported locally; one complete day correctly showed 14.80 kWh, £3.93 energy on the test schedule, £0.50 standing, 300 W overnight median. No personal meter data was accessed.
- Manual task test: 2 kWh costs 60p peak / 20p off-peak, 40p saving; separate published-rate import also checked through the UI. Lowest-cost and lowest-carbon windows can differ and both can be saved.
- Read-only live API smoke checks verified /api/insights, /api/area?postcode=SW1A, /api/market and public tariff code validation/import.
- Fixed a zero-dimension Canvas drawImage error during route changes. Fresh browser after fix: no console errors. Reminders and browser storage start off. Clear workspace resets active form state as well as saved data.
- Do not infer supplier-account linking, background push delivery, detailed per-sector current demand or individual station output from these checks. These are unconfigured/unavailable, clearly labelled paths.

## Selection-led refinement — 12 November 2026

38 tests, TypeScript and production build pass. Public region-ID lookup returns the selected regional mix without transmitting a postcode; invalid IDs and mismatched responses are rejected. Regional tariff mapping requires an exact unique published suffix. Missing tariff prices remain null during carbon-only planning.

Browser checks used selection controls only: supplier → version → region → public rates; task → energy → duration → forecast region; regional map lookup; annual example assumptions. A 2500 kWh/year scenario at 25p/kWh with 50p/day standing gives £807.50. At 390px, there is no document overflow; optional exact-value controls start closed and no text/number entry fields appear in the primary journey. No console errors were captured. Personal meter linking remains unconfigured; supplier selection is not account authorisation.

## Household continuity and CSV mapping — 12 November 2026

54 tests, TypeScript and optimized build pass. Live smoke checks imported Flexible Octopus, Co-op Flexible and an Octopus fixed product with correct direct-debit rates. Eight eligible current public offers were present at verification; this count changes with provider publication.

Browser checks verified memory-only workspace continuity across app routes, region prefill, task-draft persistence, separation of forecast region and tariff region, and selector-only CSV mapping. A synthetic file with unfamiliar headers and Wh values 500/750 correctly yielded 1.25 kWh; readings survived navigation. No personal account data was used. 390px tariff/mapping views had no document overflow. Cancelled catalogue requests no longer generate false unavailable warnings; a fresh reviewed session reported no console errors. Public refresh timers are implemented; no physical-device performance or closed-page background delivery claim is made.

## Night Atlas landing — 15 November 2026

- 63 Vitest tests pass, including nine new model/renderer regressions: deterministic geographic lights, stable projected positions on camera pan, cache reuse during animation/speed changes, pause/hidden/destroy repaint lifecycle, zero-sized surfaces, selected origins and no capacity-to-output inference. TypeScript and production build pass.
- Desktop 1280px, mobile 390px and narrow 320px checked in the local browser. No horizontal document overflow. Long site names reflow above the map. The mobile map and overlay have identical top, width and 480px height, after fixing an absolute grid-child row spanning beyond its map.
- Selected solar: real Cleve Hill metadata appears and national solar output stays “Not reported”. Selected a long Moray West site name, opened/closed the full national generation mix (including gas/nuclear), paused motion, zoomed while paused, switched to regional carbon and national demand, and navigated to Your area. The regional map still mounts with its existing selection-led journey. No runtime errors were observed. A small regional-map padding warning was caught and fixed by bounding padding to 60% of each canvas axis, with a regression check for small map sizes.
- Visual motion is illustrative; only international packet direction uses reported signed link observations. No station-level live output or station-to-home tracing was added. No deployment; no credentials required.

## Regional Balance single page — 16 November 2026

- 67 Vitest tests, TypeScript including noUnusedLocals/noUnusedParameters, and optimized production build pass. New regressions cover regional/time scoping, percentages versus national MW, legacy redirects, retired postcode lookup, and rejection of national carbon fallback for selected-region planning. Build contains one product page plus API routes.
- Browser checks: London and Scotland regional mix; map click changes selection to East England; named site details and Show site on map; regional forecast; historical observation application and Return to latest. Replay does not substitute current regional mix for archived data. Annual City of London consumption shows 2024 homes/non-domestic split separately from live demand.
- Task draft EV/14 kWh/4 hours survives closing/reopening; London planning uses its regional forecast. Annual cost example remains £807.50 for 2500 kWh, 25p/kWh and 50p/day. Escape closes the native dialog and restores focus.
- Desktop 1280px, mobile 390px and narrow 320px reviewed. No horizontal document overflow, including long region names. Mobile map and canvas bounds match. Screenshots are saved with the local review artifacts.
- Removed old page controllers/navigation, obsolete standalone dist runtime, postcode geocoding, unused fields and old layout CSS. Legacy product URLs redirect to root-page pop-ups. No deployment or account changes. Regional live MW remains unavailable: regional mix is modelled percentages, national demand is explicitly GB context, lights/domestic routes remain illustrative.

## Interactive mix and country transfers — 16 November 2026

- 71 tests pass across 17 files. New tests verify gross imports/exports on opposite French cables, missing versus zero/invalid readings, Ireland/Northern Ireland separation, unmapped codes, conservation of totals and bounded magnitude styling. TypeScript with unused-code checks and optimized production build pass.
- Browser: keyboard source selection updates the ring and renewable map view; regional Imports opens GB-scoped country cards. France cable expansion shows separate IFA/IFA2/ElecLink readings. Current totals, country import shares, labelled 24-hour trends and Follow transfers on the map verified with public observations. Renewable selection switches back from Connections to Flow. Pause changes ring motion to off along with map motion.
- Desktop, 390px and 320px reviewed. Root and country dialog have no horizontal overflow. Full-page ring/border-strip and country-popup screenshots saved in review artifacts. Final reload and country/source interactions captured no console errors or warnings; an intermediate missing callback binding was fixed before final checks.
- No new provider credentials or deployment. GB domestic metered generation, regional modelled shares and country transfers retain distinct denominators. Countries identify neighbouring grids, not original generation provenance or onward regional supply. Routes and packet speed remain schematic; international line width uses bounded reported magnitude.

## Mobile overview redesign — 16 November 2026

- Existing 71 tests across 17 files pass. TypeScript including unused-code checks and optimized production build pass. The single application route and API routes remain intact.
- In-app browser responsive checks at 390 × 844 and 320 × 740: no horizontal document overflow, long region names wrap, fuel buttons measure at least 44px high, fixed navigation stays at the viewport bottom. Main mobile view has zero map canvases on fresh load and after closing the optional map. Mobile region selection waits for workspace initialization. Loading uses a non-numeric source skeleton instead of sample values.
- Optional map sheet opens and loads one map, and releases it on close. Selected generating site focus survives map load/resize; country Follow transfers opens Connections mode. Source selection is stable on mobile after restricting hover previews to hover-capable desktop widths. Native Escape/close and body-scroll release checked.
- Bottom navigation opens energy tools. Selecting EV charging retains 14 kWh / 4 hours after closing/reopening; London regional forecast remains the planner context. More exposes power sources, transfers, saved tools, methodology and display settings. No account/storage opt-in was enabled.
- Desktop 1280 × 1000 retains one visible map and hides the mobile tool bar; resizing back to phone removes that map. Final fresh mobile page, source interaction and overview captured no console errors or warnings. Screenshots: mobile-overview-built.jpg (390 × 844 viewport), mobile-overview-full-page.jpg in the local review artifacts. Temporary viewport override reset.
- This is responsive browser evidence, not physical-device Safari/Android performance profiling. No deployment, API credentials or account changes. Data scope and illustrative-flow disclosures are preserved.

## Shared interaction motion — 16 November 2026

- 76 tests across 18 files pass; TypeScript including unused-code checks and production build pass. Five new dismissal regressions cover single completion, cancellation of queued completions, a non-settling animation promise, reduced motion, unavailable/throwing animation APIs and hidden documents.
- Mobile and desktop browser checks verify sheet-arrive versus dialog-arrive entrances, animated native details (220ms height / 180ms opacity in the reviewed browser), selector feedback and tab transitions. Native summary names remain unchanged: plus/close markers use a decorative background rather than generated spoken text.
- During closing, the native dialog remains open with its last view and body scroll locked; after completion, it is closed, tool content unmounted, body scrolling restored and the opener focused. EV charging / 14 kWh / 4 hours survived close/reopen and animated tab changes. A synthetic lower-carbon window was saved in browser memory only to check action-to-plan navigation; focus moved to My plan and the panel entrance applied. The clean review tab has no test plan. Annual example still returns £807.50 for 2500 kWh at 25p plus 50p/day. No persistence or reminders were enabled.
- Mobile map transition retained matching canvas/overlay bounds (352 × 609 in the reviewed sheet), then released all map canvases on exit. Desktop and phone views have no horizontal overflow. A fresh preview reported no console errors or warnings. Saved interaction-desktop-built.jpg and interaction-mobile-built.jpg in the local review artifacts.
- Reduced-motion logic is verified by unit tests and the CSS override; this session did not change the user's OS preference. Native control behaviour, exact observation values and timestamps remain intact. No new dependencies, credentials, external publication or deployment.

## Quiet Atlas and route integrity — 17 November 2026

- 82 Vitest tests across 19 files pass; TypeScript with noUnusedLocals/noUnusedParameters and optimized production build pass. Regression coverage checks exact arc endpoints, packet positions on the drawn polyline, distance-based sampling, pan/zoom transforms, gross opposing flows, missing/invalid/partial/zero/stale suppression, sparse visible marker spacing, no domestic routes, one selected country corridor, export reversal, paused packet anchoring and idle-frame suppression. Existing hidden-page, pause, teardown and zero-sized-canvas tests remain.
- Desktop 1280 × 900, mobile 390 × 844 and narrow 320 × 740 reviewed in the in-app browser. No horizontal overflow. Overlay and MapLibre surface bounds match. Native view/country/direction selectors, zoom/reset, pause/play, carbon switching and visible rotor selection verified. Clicking a visible Hornsea marker selects its site and keeps the map open. Source details → Show site on map returns to Seagreen in the optional mobile map.
- Mobile remains map-free on the landing page; closing the map sheet leaves zero MapLibre canvases. Short French and Irish corridors were reviewed; phone framing keeps selected transfers between controls and the selection card. Direction is selected automatically when changing countries based on observed gross flows; the opposite direction remains selectable, showing zero without moving packets when applicable. Final console review captured no errors or warnings. No real OS motion preference was changed; reduced-motion fallback remains covered by the existing unit checks.
- Review screenshots: `quiet-atlas/desktop-sources.jpg`, `quiet-atlas/desktop-corridor.jpg`, and `quiet-atlas/mobile-corridor.jpg` in the chat's local visualization artifacts. Restored the normal browser viewport after responsive checks.
- Domestic paths were removed because the feeds cannot support them. International corridors remain explicitly labelled country-level schematics, with MW totals and observation timestamps in the selection card. They do not establish physical cable routing or station-to-home provenance. No deployment or account changes.

## Source-linked map — 18 November 2026

- 85 tests across 20 files, TypeScript including noUnusedLocals/noUnusedParameters, and optimized production build pass. New regressions cover all 68 extracted MPP records and their fuel/scope/date, preservation of REPD sites, unsupported-category emptiness, exact grouping conservation, no duplicate IDs, 48px group spacing for 44px targets, projection/pan stability, zoom subdivision, co-located Heysham units and offscreen/nonfinite geometry. Existing transfer direction, stale/zero/partial suppression, route alignment, pause/hidden/unmount checks remain. Removed obsolete three-marker cap tests.
- Desktop: Gas selects the gas tile and shows 49 station records, all represented by markers or groups after fitting. Peterhead opens its May 2026 metadata (1,180 MW installed capacity; measured output unavailable). Nuclear directory → Heysham 1 → Show site on map tested; its two-record co-located group exposes both names, and selecting Heysham 2 returns focus to the selected marker without changing region. A 78-record mixed group zooms into smaller groups and individual sites, retaining keyboard focus on the map canvas.
- Country cards: Norway import directly selects the Norway → GB corridor, updates its observation card and removes all domestic source targets. Ireland export selects the reverse direction and gross export MW. Other clears old source targets and shows unavailable locations. Show all sources clears the selected source and restores the 173-record inventory. No map select elements remain. Final console review has no warnings/errors.
- Mobile 390 × 844 and 320 × 740: no horizontal overflow; demand stays visible; source tiles exceed 44px minimum height. Gas selection opens the optional map sheet with all 49 station records represented after fit. Surface and canvas bounds match exactly; no map dropdowns. Closing the sheet leaves zero MapLibre canvases on the overview. A country import also opens the appropriate map sheet with no source markers. Regional/national data denominators remain independent; site records never establish station-to-home provenance or current running status.
- Screenshots saved to the chat's `source-linked-map` visualization folder: desktop and phone Gas map/source controls. Responsive viewport override is reset after checks. Local only; no account or hosting changes.
- Final visual review caught a stylesheet-cleanup error affecting country spacing. Restored the original valid stylesheet and removed retired selectors through PostCSS, preserving comments and unrelated rules. Re-ran all 85 tests, unused-code checks and production build. A clean browser reload verifies desktop country margins at 32px, non-wrapping transfer buttons, no horizontal overflow and zero map selects; the final 390px check verifies mobile margins, visible demand, zero overview canvases and 49 represented Gas records in the sheet. Final screenshots replace the intermediate images.
