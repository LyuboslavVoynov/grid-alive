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
