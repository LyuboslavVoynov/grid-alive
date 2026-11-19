"""Extract all GB gas, nuclear and oil MPP records from DESNZ DUKES 5.11.
Usage: python3 scripts/import-power-stations.py DUKES_5.11.xlsx OUTPUT.json
Requires openpyxl. Coordinates remain OSGB36 until prepare-power-stations.mjs.
The register covers major power producers, not every small generator.
"""
import json, math, sys
import openpyxl

rows = list(openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)['5.11 Full list'].values)
header = next(i for i, r in enumerate(rows) if r[0] == 'Company Name [note 30]' and r[1] == 'Site Name')
fuels = {'Natural Gas': 'gas', 'Nuclear': 'nuclear', 'Diesel/Gas Oil': 'oil'}
items, rejected = [], []
for r in rows[header + 1:]:
    if r[9] not in ['England', 'Scotland', 'Wales'] or r[5] not in fuels:
        continue
    try:
        x, y, capacity = float(r[13]), float(r[14]), float(r[7])
        if not all(math.isfinite(n) for n in [x, y, capacity]) or not (0 < x < 700000 and 0 < y < 1300000 and capacity > 0) or not r[16]:
            raise ValueError('Invalid coordinate/capacity/code')
    except (ValueError, TypeError):
        rejected.append(str(r[1]))
        continue
    items.append({'id': 'dukes-' + str(r[16]), 'name': str(r[1]).strip(), 'fuel': fuels[r[5]], 'technology': str(r[3]), 'capacityMw': capacity, 'turbines': None, 'country': r[9], 'region': r[10], 'updated': '2026-05-31', 'snapshot': 'May 2026', 'source': 'DESNZ DUKES 5.11 · May 2026', 'status': 'Operational in May 2026 register; current operation not established', 'bng': [x, y]})
if rejected:
    raise ValueError('Rows require review; no silent drops: ' + ', '.join(rejected))
assert len(set(r['id'] for r in items)) == len(items)
with open(sys.argv[2], 'w') as f:
    json.dump(items, f)
print('Extracted', len(items), 'GB major-producer records;', {fuel: sum(r['fuel'] == fuel for r in items) for fuel in fuels.values()})
