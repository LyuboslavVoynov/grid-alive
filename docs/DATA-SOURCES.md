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
