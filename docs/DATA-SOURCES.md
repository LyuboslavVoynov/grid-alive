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

Postcodes.io outward-code lookup provides an approximate centroid and a list of intersecting local authorities. Only the outward code is transmitted. Source: https://postcodes.io/docs/outcode/lookup/ ; geographic data contains OS and ONS open data (see https://postcodes.io/about/). Do not assume one authority per outward code. NESO postcode modelled mix is a separate grid-region classification, including imports and embedded generation; nearby sites do not imply direct supply.

## Britain insights (v2)

Elexon public system/frequency, datasets/INDO, forecast/demand/day-ahead/latest (nationalDemand), forecast/generation/wind/latest, remit/list/by-event/stream and individual remit/{id} messages. Requests are bounded to recent history / next 48 hours, cached per process, with partial results. Frequency is a timestamped observation, not a real-time guarantee. Demand comparison aligns UTC intervals 24 hours apart. REMIT is a selected set of five latest overlapping published messages, not exhaustive station availability; status and event window are shown. Declared unavailable capacity is not actual unit output. NESO /intensity/{from}/fw48h supplies national carbon forecasts. Published forecast gaps remain gaps.

## Household tariffs and wholesale context (v2)

Octopus public API: https://api.octopus.energy/v1/products/ and product electricity-tariffs/{code}/standard-unit-rates/ and standing-charges/. Support public Agile import, direct-debit tariffs only; exact code must be selected from the product response. Use value_inc_vat in p/kWh and p/day; preserve negative prices, explicit valid_from/valid_to, and unreported future intervals. Fetch at most the previous 14 days plus the next 48 hours. Standing charge is current, not a historical standing-charge schedule. Does not handle personalised intelligent charging, export tariffs, supplier switching or account consumption. Public tariff availability does not establish user eligibility. Manual rates must be VAT-inclusive; recurring two-rate schedules use Europe/London with half-hour boundaries.

Elexon /balancing/pricing/market-index supplies APXMIDP observations with positive traded volume. Display the latest reported index and past 24 hours in GBP/MWh. Divide by 10 for the equivalent p/kWh energy-only scale, not a retail tariff. No future wholesale-price forecast. No combination of different index providers.

Task planner integrates constant power across fully covered rate intervals. A gap produces unknown cost/carbon, never free electricity. Compare half-hour start windows, at most 48 hours, bounded by user deadline; estimates use editable task energy/duration. Standing charges cancel in task timing comparisons and are excluded. Carbon uses NESO forecasts with their own coverage; no claim that cheap and clean coincide. These are consumption estimates, not financial or appliance-control services.
