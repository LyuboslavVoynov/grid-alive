"""Extract the latest year from the official DESNZ stacked LA CSV.
Usage: python3 scripts/prepare-annual-consumption.py /path/to/elec_LA_stacked_2005-2024.csv
Source URL and licence: docs/DATA-SOURCES.md. No downloaded source is required at runtime.
"""
import csv, json, sys
from pathlib import Path
rows = list(csv.DictReader(open(sys.argv[1], encoding='cp1252')))
year = max(int(r['Year']) for r in rows)
out = []
for r in rows:
    if int(r['Year']) != year:
        continue
    try:
        out.append(dict(code=r['LA_Code'], name=r['LA'], region=r['Region'], year=year,
                        domesticGwh=float(r['Domestic_consumption_GWh']),
                        nonDomesticGwh=float(r['Non_domestic_consumption_GWh']),
                        totalGwh=float(r['All_consumption_GWh']),
                        meanDomesticKwh=float(r['Domestic_mean_consumption_KWh_per_meter'])))
    except ValueError:
        continue
Path('data/annual-consumption.json').write_text(json.dumps(out, indent=2) + '\n')
print(f'Extracted {len(out)} authorities for {year}')
