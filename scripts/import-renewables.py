"""Create the bounded REPD extract used by prepare-geography.mjs.
Usage: python3 scripts/import-renewables.py /path/to/REPD.csv
"""
import csv, json, sys
allowed={'Wind Offshore':'wind','Wind Onshore':'wind','Solar Photovoltaics':'solar','Large Hydro':'hydro','Small Hydro':'hydro','Biomass (dedicated)':'biomass'}
with open(sys.argv[1],encoding='cp1252',newline='') as source:
    rows=list(csv.DictReader(source))
items=[]
for row in rows:
    if row['Development Status (short)']!='Operational' or row['Country'] not in ['England','Scotland','Wales'] or row['Technology Type'] not in allowed: continue
    try:
        point=[float(row['X-coordinate']),float(row['Y-coordinate'])]
        capacity=float(row['Installed Capacity (MWelec)'])
        turbines=int(float(row['No. of Turbines'])) if row['No. of Turbines'].strip() else None
    except ValueError: continue
    if capacity<=0: continue
    items.append({'id':'repd-'+row['Ref ID'],'name':row['Site Name'],'technology':row['Technology Type'],'fuel':allowed[row['Technology Type']],'capacityMw':capacity,'turbines':turbines,'bng':point,'country':row['Country'],'updated':row['Record Last Updated (dd/mm/yyyy)']})
selected=[]
for technology in allowed:
    group=sorted([item for item in items if item['technology']==technology],key=lambda item:-item['capacityMw'])
    selected.extend(group[:30 if technology=='Wind Offshore' else 15])
with open('/tmp/grid-assets-bng.json','w') as target: json.dump(selected,target)
print('Prepared',len(selected),'selected renewable records')
