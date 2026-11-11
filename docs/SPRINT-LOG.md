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
