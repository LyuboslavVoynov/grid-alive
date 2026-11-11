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
