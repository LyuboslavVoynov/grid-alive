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

- 32 unit/data tests pass; TypeScript and Next.js optimized build pass.
- Browser desktop and 390 × 844 narrow view: route navigation, tariff form, task planner, supply/demand/outlook, regional postcode and personal usage. Narrow views have no horizontal document overflow; map pitch remains locked at zero.
- Synthetic QA CSV only (outside repository and never a default): 336 half-hour records imported locally; one complete day correctly showed 14.80 kWh, £3.93 energy on the test schedule, £0.50 standing, 300 W overnight median. No personal meter data was accessed.
- Manual task test: 2 kWh costs 60p peak / 20p off-peak, 40p saving; separate published-rate import also checked through the UI. Lowest-cost and lowest-carbon windows can differ and both can be saved.
- Read-only live API smoke checks verified /api/insights, /api/area?postcode=SW1A, /api/market and public tariff code validation/import.
- Fixed a zero-dimension Canvas drawImage error during route changes. Fresh browser after fix: no console errors. Reminders and browser storage start off. Clear workspace resets active form state as well as saved data.
- Do not infer supplier-account linking, background push delivery, detailed per-sector current demand or individual station output from these checks. These are unconfigured/unavailable, clearly labelled paths.
