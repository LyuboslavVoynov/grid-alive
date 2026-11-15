# GRID / ALIVE — delivery plan

Updated 11 November 2026. Owner decisions: public website, no sign-in; GitHub repository under LyuboslavVoynov; initial map release delivered; the approved v2 storyboard now includes costs and household tools. Hosting decision: keep the application local for now; do not deploy.

## Product baseline

Preserve the approved top-down night-map design, cyan coastal and energy lighting, warm city lights, restrained overlays, and animated turbines. The existing dist/ motion study is a design reference, not production architecture or a source of measured data. Keep it runnable throughout migration.

Initial release: GB generation by fuel in GW and percentages; clearly defined demand and imports/exports; national carbon intensity; interactive map and licensed asset locations; conceptual animated energy activity; interconnector measurements; historical replay of the preceding 24 hours; mobile, keyboard, reduced-motion and outage support. No prices, household tariffs, accounts, payments, or database unless a concrete need appears.

## Branch and review workflow

main is the integrated, working baseline. Preserve the approved prototype with tag design/motion-study-v1. Use short-lived codex/ feature branches from current main, one coherent change per PR, squash after checks and review. No long-lived develop branch. Create branches when work starts, not all at once; rebase dependent work after prerequisite merges. Keep external publication separate from local review. At each sprint review report what runs, which data is measured/estimated/forecast/illustrative, validation evidence, limitations and the next step. Major visual departures require owner review.

## Sprints

Sprints are ordered, reviewable milestones rather than promised calendar durations. Estimate dates after the foundation and provider probes establish effort and constraints.

### Sprint 0 — baseline and delivery setup

Branch: codex/sprint-00-planning.

- Preserve the approved prototype in local Git and tag it.
- Record scope, acceptance criteria, branch strategy and data decisions.
- Repository: LyuboslavVoynov/grid-alive, created public by the owner. Preserve this audience; website access is configured separately.
- Recommended hosting: Next.js on Vercel for the original brief's App Router stack. Confirm actual plan limits/cost and connect the chosen account before deployment. Existing Sites identity remains a historical prototype hosting record; no audience change or deployment is implied.
- Remove sample pricing from the local concept to reflect launch scope.

Done when the baseline is recoverable, repository access is established, and this plan is reviewable. GitHub app access is confirmed; hosting setup may later require an account session. Do not request electricity API keys.

### Sprint 1 — application and map foundation

Branches (in dependency order): codex/app-foundation, codex/top-down-map.

- Next.js App Router, React, TypeScript; retain the original brief's stack unless a verified deployment constraint justifies a change.
- Extract theme tokens and responsive overlays; preserve visual parity with the prototype.
- MapLibre for flat geographic pan/zoom and licensed geographic styling; use a custom GPU/canvas layer for motion as needed. Avoid paid basemap requirements.
- Document projection, map fitting, resize behavior and high-DPI handling.
- Add appropriate CI: typecheck, production build, data-unit and browser smoke checks as they become applicable.

Done when the production app opens immediately onto Britain, pans/zooms/resets, preserves state through resizing, works with keyboard/touch, and honors reduced motion. Review desktop and mobile side by side with the approved concept.

### Sprint 2 — trustworthy current electricity data

Branches: codex/data-contracts, codex/live-generation.

- Probe Elexon generation/demand/interconnector responses and NESO carbon responses before choosing datasets.
- Define normalized observations with provider, metric, units, geographic coverage, reporting interval, published/retrieved times, quality (measured/estimated/forecast), revisions and freshness.
- Resolve embedded solar/wind coverage, fuel classifications, battery and pumped-storage treatment, and the denominator for shares. Never combine a generation total from one methodology with percentages from another without reconciliation.
- Calculate domestic generation shares from one compatible snapshot. Keep import/export accounting separate. Do not force demand = generation + net imports across incompatible definitions, intervals or loss conventions.
- Server-side adapters, schema validation, bounded requests, caching, retries and clear unavailable/stale states. Respect provider cadence rather than poll every animation frame.
- Remove sample values from production; isolate explicitly labelled development fixtures.

Done when real generation shares and GW, demand, net imports and national carbon data show their own observation times and quality. Test inconsistent/missing intervals, unit conversions, unknown fuel types, negative storage values, partial responses, revisions and outages. Prices stay absent.

### Sprint 3 — geography and data-driven motion

Branches: codex/energy-asset-geography, codex/data-driven-motion.

- Verify asset coordinates, licensing and attribution; record coverage and known gaps.
- Add source-specific markers and contextual details, avoiding claims of per-asset output without per-asset evidence.
- Connect national/fuel-level visual activity to compatible observations; turbines and particles remain explicitly illustrative, not measurements of turbine RPM or exact physical flows.
- Connect international direction/intensity only where corresponding measured interconnector data exists; do not silently use aggregates as individual-link measurements.
- Animate at a stable frame rate, avoid React updates per particle, adapt quality and suspend unnecessary rendering when hidden or paused.

Done when changing actual observations changes the correct visual layer, signs and units are correct, map controls remain fluid, and asset details disclose the evidence available for that location. Review motion with the owner.

### Sprint 4 — regional carbon and 24-hour replay

Branches: codex/regional-carbon, codex/historical-replay.

- License and validate official regional boundaries; identify regional forecast/modelled values explicitly.
- Add carbon mode with a readable gCO2/kWh legend and accessible alternatives.
- Add the preceding 24 hours of compatible historical observations, play/pause/scrub, time labels and return-to-latest.
- Store UTC internally; display Europe/London correctly through daylight-saving transitions and settlement-period changes.
- Show unavailable historical asset-level data as unavailable, not a replay of current measurements. Do not blend current and historical overlays.

Done when every time-dependent supported layer changes with the selected observation period, gaps are visible, and replay never substitutes decorative values. Browser tests cover scrubbing, return-to-latest and missing periods; unit tests cover clock changes.

### Sprint 5 — public release

Branches: codex/launch-hardening, codex/deployment.

- Profile frame rate, memory, CPU/GPU and load costs on representative desktop/mobile devices; tune quality and asset budgets.
- Complete keyboard, touch, contrast, screen-reader and reduced-motion checks; verify browser compatibility.
- Verify outage recovery, caching, upstream request volume, request validation and operational logs.
- Add methodology and source/attribution pages; document dataset limitations and fixture policy.
- Connect selected hosting, preview environment and optional domain. Run production build and deployment smoke checks. Publish with the approved public website audience.

Done when the public URL is verified, no sample numbers appear as measurements, source/interval/freshness are visible, and deployment/rollback instructions are usable.

## Access and decisions

- Elexon Insights public APIs require no key: https://developer.data.elexon.co.uk/
- NESO national intensity endpoint requires no authentication: https://carbon-intensity.github.io/api-definitions/
- Data catalogue: https://bmrs.elexon.co.uk/api-documentation/endpoint
- GitHub: use the connected GitHub app authenticated as LyuboslavVoynov, as in matchbound-main. Do not use, switch, or reauthenticate the local CLI account. The owner created grid-alive and added it to the existing app installation; repository access is confirmed.
- Hosting: recommend Vercel for Next.js; account connection, spending approval if necessary, and any domain setup are later inputs. Never request secret values pasted into chat; use host environment settings/local secrets.
- Optional owner input: target launch date and preferred domain. Neither blocks local foundation work.

## Current status

Sprints 0–4 are implemented and merged: production Next.js map, real timestamped Elexon/NESO observations, selected licensed renewable-site geography, regional carbon and 24-hour replay. Sprint 5 local hardening is implemented; the owner has explicitly deferred public deployment and requested local-only operation for now. The approved standalone prototype retains sample figures for design reference. See docs/SPRINT-LOG.md and docs/QA.md. No public launch has occurred.


## Approved v2 — storyboard delivery (11 November 2026)

The owner approved all eight storyboard scenes and instructed sequential implementation. Local-only remains in force. The historical initial-release exclusions above describe v1 and are superseded for v2 by this section.

| Sprint | Branch | Deliverable / acceptance |
| --- | --- | --- |
| V2.1 | codex/v2-01-navigation | Britain / Your area / Your home navigation, shareable routes, cohesive responsive shell; preserve flat animated map. |
| V2.2 | codex/v2-02-britain-insights | Demand history and comparisons, real timestamped frequency, demand/wind/carbon outlook and published operational context; gaps remain gaps. |
| V2.3 | codex/v2-03-local-insights | Validated outward postcode lookup; regional modelled fuel mix and carbon; nearby dated assets; sourced annual domestic/non-domestic local consumption. |
| V2.4 | codex/v2-04-cost-planner | Manual single/time-of-use tariff and public supplier rate import, standing charges, separate wholesale index; valid time-window task costs and carbon with explainable arithmetic. |
| V2.5 | codex/v2-05-home-usage | Browser-local CSV import, validated readings, daily/weekly costs and baseline insight, practical plan, tariff scenario comparison, opt-in in-page reminders and clear-data. |
| V2.6 | codex/v2-06-integration-qa | End-to-end navigation, mobile and keyboard review, meaningful data/calculation tests, typecheck/build, updated sources and limitations. |

Each sprint is implemented and checked before the next branch is created. Local branches form an ordered commit chain; repository publication uses the connected GitHub app only. Do not switch or authenticate the CLI account. No hosting deployment.

### Data and personal-data decisions

Use public Elexon, NESO, DESNZ and supported supplier APIs without secrets. Manual tariff and file import are working first-class paths. Do not invent measured city/sector demand, individual-site output, future prices, or personal meter data. Forecasts, dated annual data and measurements are explicitly different. Local personal readings never leave the browser and are not persisted unless chosen. Public tariff import needs no account. Authenticated meter connection and background notifications require a later explicit provider/setup decision; do not ship inert controls that imply those connections exist. Notify the owner if a required provider feature is unavailable, continue independent work.

### Validation

Check interval coverage, gaps, DST, negative unit prices, standing-charge accounting, single-rate zero timing savings, CSV overlap/duplicates/invalid timestamps, postcode errors, provider outages, and no fixture data in live views. User-facing forecasts only cover published periods. Savings estimates show assumptions and exclude automatically extrapolated annual claims. No appliance control.

### V2.7 — selection-led refinement (12 November 2026)

Owner decision: avoid typing wherever possible across location, supplier, tariff and tasks. Branch codex/v2-selection-first builds on v2. Replace the primary postcode input with a region selector; replace tariff-code selection with human-readable regions; make public supplier selection primary and exact bill-rate entry optional. Use selectable task amounts, durations and annual scenario presets with optional exact refinements. Keep personal readings behind authorised access or local file import; selecting a supplier is not access consent. Enable carbon-only task planning when no price is available. No deployment.

### V2.8 — household continuity and broader tariff data (12 November 2026)

Branch codex/v2-household-continuity. Preserve the selection-led journey while removing repeated setup across navigation: shared memory-only workspace, region hints for tariff setup, persistent task drafts, and backward-compatible opt-in storage. Broaden the public catalogue to validated ordinary import plans from Octopus Energy, Co-op Energy and London Power; preserve payment-method distinctions, validity intervals and missing prices. Refresh public rates while visible, without accessing accounts. Let visitors match unfamiliar CSV columns with selectors, including explicit Wh/kWh conversion. Keep meter connections unconfigured until a real authorisation service is selected; never substitute public tariff access for permission to read consumption. Local-only operation remains in force.
