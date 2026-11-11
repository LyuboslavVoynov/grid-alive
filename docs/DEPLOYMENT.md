# Deployment and operation

## Current owner decision

Keep the application local for now. The hosting instructions below are for a future deployment, not authorization to deploy.

## Readiness

This project is prepared for a public Next.js deployment. No API secrets, accounts or database are required for electricity data. The geographic files and MapLibre workers are served from the deployment itself. The source repository is public; the standalone design prototype in dist/ remains explicitly illustrative.

## Vercel deployment

Connect the owner's Vercel account and import LyuboslavVoynov/grid-alive. Use the Next.js framework preset, repository root, npm ci, and npm run build; no custom output-directory override. Use Node.js 22 or a later supported LTS. The postinstall hook copies the MapLibre module worker and shared module into public/vendor. Do not exclude that generated directory from the build output.

Before any paid plan, confirm applicable limits and cost with the owner. No paid map service is necessary. Custom domains are optional and can follow the initial generated URL. Production is public, without sign-in.

Verify /, /methodology, /api/grid, /api/regional, /api/history and /vendor/maplibre-gl-worker.mjs. Check the visual coastline layer, regional mode, actual source timestamps, and prior-day replay. Do not declare launch complete until the deployed URL and its server-side upstream access are verified.

## Observation cache

The application uses a bounded process-local cache plus CDN response headers. Instances can duplicate upstream calls, and cold starts have no stale backup. This deliberately avoids a database for the initial release. If traffic requires shared caching, add a host-supported shared cache rather than increasing upstream polling. Current data refresh is one minute for FUELINST and five minutes for demand/carbon/regional; history is cached for ten minutes per half-hour window. Cache fallback is permitted for up to six hours, always labelled delayed. There is no fictional fallback.

Requests use fixed provider hosts, timeouts, bounded response size and one retry. Historical requests are fixed to the preceding 24 complete settlement periods; arbitrary browser URLs or date ranges are not proxied. Source failures produce partial/unavailable states. Server logs record generic provider or validation failures without credentials.

## Routine checks

- npm ci
- npm test
- npm run typecheck
- npm run build

CI runs the last three checks on branches and PRs. Source updates should use short-lived branches and the connected GitHub app. Read-only Git fetch does not need the terminal's GitHub account changed.

## Rollback

Use the hosting provider's deployment history to restore the last verified deployment. Roll back application code and geographic files together. Do not change data quality labels or replace measurements with fixtures during an outage. If upstream access fails, the unavailable/stale view is the intended safe state.

## Geographic refresh

Download the official REPD CSV and NESO GeoJSON listed in docs/DATA-SOURCES.md, inspect licensing and schema, then run:

```sh
python3 scripts/import-renewables.py /path/to/REPD.csv
node scripts/prepare-geography.mjs assets
# Place the downloaded DNO GeoJSON at /tmp/grid-dno.json:
node scripts/prepare-geography.mjs regions
npm test
```

Review the resulting IDs, coordinate bounds, licence attribution and snapshot date before publication. Update snapshot labels when refreshing; do not silently relabel an old inventory as current.
