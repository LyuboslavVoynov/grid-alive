# Geographic source register

## Natural Earth coastlines

Public domain. Simplified 1:10m admin-0 country geometry, obtained from the Natural Earth maintained repository. Coastlines are for visual context, not operational navigation.

## Selected operational renewable projects

Publisher: Department for Energy Security and Net Zero, compiled by Barbour ABI. Snapshot: REPD July 2026 (Q2 2026). Retrieved 11 November 2026.

- Source page: https://www.gov.uk/government/publications/renewable-energy-planning-database-quarterly-extract
- File: https://assets.publishing.service.gov.uk/media/6a6cbdc00c36759b5ccaa305/REPD_Publication_Q2_2026.csv
- Licence evidence: https://www.data.gov.uk/dataset/a5b0ed13-c960-49ce-b1f6-3a6bbe0db1b7/repd — UK Open Government Licence.
- Attribution: Contains public sector information licensed under the Open Government Licence v3.0. © Crown copyright 2026.

Extract operational records for England, Scotland and Wales only. Display up to 30 largest offshore wind projects and up to 15 largest in each included onshore wind, solar PV, large/small hydro and dedicated biomass category. This is a selected set, not a complete power-station inventory. It excludes fossil and nuclear stations and most smaller projects. Operational status and installed capacity are facts from the dated source snapshot, not live status or current output.

British National Grid coordinates are converted to WGS84 using the standard OSGB36 seven-parameter Helmert transformation through proj4. These are approximate site reference points, not precise turbine coordinates; OSTN15 survey-grade conversion is not used. Turbine symbols are stylised and do not depict the recorded turbine count or individual turbine positions. The offline preparation script consumes a selected extract from /tmp/grid-assets-bng.json; the original CSV is not shipped to browsers.

## Regional carbon boundaries

Publisher: NESO. GB DNO Licence Areas, version 20240503, retrieved 11 November 2026.

- Source: https://www.neso.energy/data-portal/gis-boundaries-gb-dno-license-areas
- File: https://api.neso.energy/dataset/0e377f16-95e9-4c15-a1fc-49e06a39cfa0/resource/1c6a7dc0-1b6c-443a-bc67-5f7125649434/download/gb-dno-license-areas-20240503-as-geojson.geojson
- Licence: https://www.neso.energy/data-portal/neso-open-licence
- Attribution: Supported by National Energy SO Open Data.

Convert the EPSG:27700 source with the same approximate Helmert conversion and simplify in its metre-based source CRS with a 400m tolerance. Preserve polygon holes. Match the source GSP letters to NESO Carbon Intensity region IDs explicitly. Boundary ID is not the Carbon Intensity region ID. These are approximate service areas; NESO notes they can be outdated and are not 100% accurate. Do not use for operational connection decisions.

## Local consumption and postcode context (v2)

DESNZ stacked local authority electricity consumption, 2005–2024; latest year 2024 extracted into data/annual-consumption.json. Published 18 December 2025, retrieved 11 November 2026. Units GWh/year and kWh per domestic meter. Domestic and non-domestic are meter classifications; not real-time demand or a detailed industry decomposition. No geographic reassignment is inferred when boundaries change.

- Page: https://www.gov.uk/government/statistical-data-sets/stacked-electricity-consumption-statistics-data
- CSV: https://assets.publishing.service.gov.uk/media/694295bd9273c48f554cf4ef/elec_LA_stacked_2005-2024.csv
- OGL v3.0; contains public sector information © Crown copyright 2025.
- Rebuild: python3 scripts/prepare-annual-consumption.py /path/to/source.csv

Typed-postcode lookup and its Postcodes.io integration were retired on 16 November 2026. The API now requires a validated electricity-region ID. No postcode or geocoder requests are made. Local-authority annual consumption remains a separately selected geography and is never automatically assigned to a grid region.

## Britain insights (v2)

Elexon public system/frequency, datasets/INDO, forecast/demand/day-ahead/latest (nationalDemand), forecast/generation/wind/latest, remit/list/by-event/stream and individual remit/{id} messages. Requests are bounded to recent history / next 48 hours, cached per process, with partial results. Frequency is a timestamped observation, not a real-time guarantee. Demand comparison aligns UTC intervals 24 hours apart. REMIT is a selected set of five latest overlapping published messages, not exhaustive station availability; status and event window are shown. Declared unavailable capacity is not actual unit output. NESO /intensity/{from}/fw48h supplies national carbon forecasts. Published forecast gaps remain gaps.

## Household tariffs and wholesale context (v2)

Octopus public API: https://api.octopus.energy/v1/products/ and product electricity-tariffs/{code}/standard-unit-rates/ and standing-charges/. Support public Agile import, direct-debit tariffs only; exact code must be selected from the product response. Use value_inc_vat in p/kWh and p/day; preserve negative prices, explicit valid_from/valid_to, and unreported future intervals. Fetch at most the previous 14 days plus the next 48 hours. Standing charge is current, not a historical standing-charge schedule. Does not handle personalised intelligent charging, export tariffs, supplier switching or account consumption. Public tariff availability does not establish user eligibility. Manual rates must be VAT-inclusive; recurring two-rate schedules use Europe/London with half-hour boundaries.

Elexon /balancing/pricing/market-index supplies APXMIDP observations with positive traded volume. Display the latest reported index and past 24 hours in GBP/MWh. Divide by 10 for the equivalent p/kWh energy-only scale, not a retail tariff. No future wholesale-price forecast. No combination of different index providers.

Task planner integrates constant power across fully covered rate intervals. A gap produces unknown cost/carbon, never free electricity. Compare half-hour start windows, at most 48 hours, bounded by user deadline; estimates use editable task energy/duration. Standing charges cancel in task timing comparisons and are excluded. Carbon uses NESO forecasts with their own coverage; no claim that cheap and clean coincide. These are consumption estimates, not financial or appliance-control services.

## Selection-led region lookup (12 November 2026)

NESO /regional/intensity/{from}/fw48h/regionid/{id}, restricted to the fourteen grid regions. Shared IDs/GSP letters are the same mapping as the licensed DNO boundary preparation. No postcode or geocoder request occurs for selected regions. Regional map focus and featured-site distances use the centre of the simplified boundary's longitude/latitude bounding box, explicitly labelled a regional reference point rather than the visitor's location. Selecting a human-readable tariff region matches exactly one published product tariff suffix; missing or ambiguous matches are unavailable, never guessed.

Task/annual selection presets are illustrative assumptions, not reported personal readings, supplier quotes or guaranteed consumption. Exact values are optional. In carbon-only planning an absent tariff produces null cost and no price savings; forecast carbon still uses compatible published periods. Supplier selection supports public Agile tariffs only and does not establish account access.

## Broader public tariff catalogue and CSV mapping (12 November 2026)

Public Octopus product catalogue metadata identifies brand, direction, availability and eligibility flags. Explicit supported families: AGILE/VAR/OE-FIX for OCTOPUS_ENERGY; COOP-VAR/COOP-FIX for COOP_ENERGY; LP-VAR for LONDON_POWER. Only current import, non-business, non-prepay, non-restricted, non-Tracker offers are eligible. Unknown, personalised smart-charging and export families stay excluded. Product detail may omit direction; the already-validated catalogue supplies it, while any explicit contradiction is rejected.

The catalogue is bounded to four constructed pages; arbitrary next URLs are not followed. Product detail accepts direct_debit_monthly or varying code structures. Explicit DIRECT_DEBIT prices take precedence over overlapping generic rows; NON_DIRECT_DEBIT rates are excluded. Conflicting/overlapping intervals and truncated responses are unavailable. Every published tariff retains its supplier/product/tariff/region identifiers, enabling public refresh at most every five minutes while visible. No customer account is read and no supplier switch occurs.

CSV header matching is local-only. Recognised headers auto-map; otherwise visitors select three distinct columns and the energy unit, and confirm interval-energy semantics. Wh is divided by 1000 before the existing half-hour, timezone, overlap, sign and range validation. Missing explicit timezone information is rejected rather than inferred. Raw files and three-row previews are not uploaded or persisted; only validated readings are optionally saved on-device.

## Night Atlas landing and motion (15 November 2026)

The landing page retains the dated July 2026 REPD reference points and adds selection by wind, solar, hydro and biomass. It does not add unit-level output, a station-to-home trace or a complete station inventory. The national FUELINST observation for the selected fuel is separate from the selected site's installed capacity. Missing solar output stays unavailable; no allocation of national generation to sites is inferred. The source register contains postcode fields, but the current bounded import retains coordinates rather than postcodes; geographic artwork does not need visitor input.

Settlement lights are deterministic longitude/latitude points around named city reference points, clipped to land. They remain procedural artwork, not measured demand or satellite imagery. Canvas drawing runs on MapLibre's render event with a single animation clock. Static light texture is invalidated on camera/size/light-layer changes rather than every animation or data update. Geographic projection is shared with the displayed camera.

Quiet Atlas supersedes the former invented domestic source-to-network story (17 November 2026). Domestic junctions and flow paths are removed: the connected APIs do not measure those routes. The initial version capped reference markers at three. The 18 November source-linked map below replaces that cap with groups representing all loaded station records; drawing and hit testing still share one geometry. Rotor speed is illustrative and never encodes site output. Settlement lights are static, reduced-density artwork. Sources, transfers and regional carbon are separate map views. Motion pauses on request, initially for reduced-motion preferences, and while hidden.

## Regional Balance, one-page interface (16 November 2026)

All core information now shares one UI route. Region selection highlights the matching licensed DNO geometry; the selected modelled mix must cover the current time and match that region ID. Previous-region, future and expired intervals are never substituted under a new heading. National generation retains its metered MW coverage, and national demand is explicitly GB context when viewing a region. No compatible live regional MW feed has been connected, and there are no sample regional power values in the application. Carbon and each national observation keep independent source times and delayed/error labels.

Forecast, replay, sources, household tools and definitions are pop-ups over the map. Applying a historical snapshot changes the map's observation context and exposes Return to latest. Regional fuel mix is withheld during replay rather than filled from a current forecast. Source-site metadata remains dated artwork context. The existing annual calculator was extracted into a shared component without changing its assumptions or arithmetic.

Typed postcode lookup, Postcodes.io requests and their unused fields have been removed. /api/area accepts only a validated region ID. Old UI URLs redirect to the relevant root-page tool; they no longer ship separate page shells. Household workspace state lives above the pop-ups and retains the existing opt-in local persistence policy.

## Country transfers and generation ring — 16 November 2026

Elexon FUELINST signed cable readings are grouped using the [Elexon fuel-type/interconnector list](https://www.elexon.co.uk/documents/data/list-of-fuel-types/). France: IFA/IFA2/ElecLink; Netherlands: BritNed; Belgium: Nemo; Norway: NSL; Denmark: Viking; Ireland: East-West/Greenlink; Northern Ireland: Moyle. These identify the immediately connected grid, not original generation provenance or onward regional supply. Gross imports/exports are separate; percentage denominator is gross reported GB imports. Missing and invalid values remain unavailable, unknown codes remain unmapped.

Quiet Atlas replaces the per-cable paths with one selected country-level corridor. Its representative grid anchors are not surveyed cable landfalls. One geographic great-circle arc is projected once per camera change, and the visible stroke and packets share that polyline. Arc-length sampling keeps packet spacing/speed consistent; normalized progress survives pan/zoom. Mint indicates imports, amber exports. Gross directions remain separate, selectable even when a country sends and receives simultaneously. Missing, partial, zero and stale country readings suppress moving packets. Width and speed do not encode magnitude; MW totals appear in the selection card. Country net-transfer sparklines use archived half-hour observations, omit partial-country readings and leave temporal gaps beyond 35 minutes; each has a labelled symmetric scale and shared visible period. Current transfer observations and historical trends can end at different times. No extra API or account authorisation is needed.

## Source-linked map and major-producer stations — 18 November 2026

The generation split now selects station locations directly; country cards select signed international corridors. Map View and Site dropdowns are removed. All loaded source records are represented by individual markers or numbered groups, with one deterministic geometry shared by drawing and native 44px targets. Nearby markers cluster at 48px minimum spacing; zooming reveals records, and co-located units expose a named member list. The station directory remains available for every loaded record. No category silently falls back to wind: unsupported Other/Coal selections show unavailable locations. GB station locations are not presented as the origins of a selected region's electricity.

The [DUKES 5.11 workbook](https://assets.publishing.service.gov.uk/media/6a6a365b0ddb7e4831c629f3/DUKES_5.11.xlsx), published 30 July 2026 with operational-at-end-May-2026 records, was retrieved on 18 November 2026. Only the `5.11 Full list` worksheet is imported, never historical sheets. Includes every listed England/Scotland/Wales record whose primary fuel is Natural Gas (49), Nuclear (5), or Diesel/Gas Oil (14). Natural gas and oil-fuelled turbines remain separate. Northern Ireland is excluded from GB generating sites. The 105 featured July REPD renewable records remain alongside these 68 additions (173 records total).

Source Note 1 limits this register to Major Power Producers: other generators, including many smaller generators and auto-generators, are not individually listed. Locations and grid-connection information are generator-supplied and have not been verified by DESNZ. Coordinates are converted from the supplied OSGB36 eastings/northings to approximate WGS84 with the existing Helmert transform; there is no user geocoding, hand-placed station coordinate or guessed location. Invalid/missing coordinates cause the import to fail rather than silently dropping eligible records. Stable DESNZ site codes identify records, including co-located Heysham units. Capacity is installed MW and never substituted for current output. The May operational flag is not current running status. Individual site output remains unavailable.

Reproduce locally: `python3 scripts/import-power-stations.py DUKES_5.11.xlsx /tmp/grid-alive-stations-bng.json`, then `node scripts/prepare-power-stations.mjs /tmp/grid-alive-stations-bng.json`. The Python preparation uses openpyxl; the app has no new runtime dependencies. Data are licensed under the Open Government Licence v3.0; attribution is also included in the in-app methodology. No new API key or account connection is needed.
