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
