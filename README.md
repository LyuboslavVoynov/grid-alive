# GRID / ALIVE — motion study

A dependency-free visual prototype of direction 01. North-up, flat projection; no camera tilt, globe, or perspective. Animated canvas turbines, conceptual flow particles, city lights, zoom/reset, layer visibility, pause, and speed controls. Reduced-motion preferences pause animation by default. Responsive layout.

All asset positions and flow paths are illustrative. No generation values, actual transmission routes, measured flows, or live API connection are represented. This is a visual review milestone, not the production app from the broader brief.

Run `python3 -m http.server 4173 --directory dist` from this folder. Open http://localhost:4173.

Coastline geometry: Natural Earth 1:10m countries (public domain), simplified for this viewport. Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson . Terms: https://www.naturalearthdata.com/about/terms-of-use/ . Land texture and city illumination are procedural visual treatments, not satellite imagery.

Updated design: seven-source domestic generation table in GW and percentages, total generation, demand, net imports, and carbon intensity. All figures are fixed sample data for layout review; no API is connected. Mobile generation details expand from the compact summary.

Initial release: public website without sign-in; prices deferred. See [the sprint plan](docs/BUILD-PLAN.md) for branches, acceptance criteria, data rules and required access.
