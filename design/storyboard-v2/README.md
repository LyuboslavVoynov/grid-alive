# GRID / ALIVE — proposed product storyboard

Static design proposal only. No implementation, branch changes, sprint planning or deployment is included in this design task. Every numerical reading, tariff, saving and consumption profile in these images is sample data.

## Journey

| Scene | View | User purpose |
| --- | --- | --- |
| 01 | Britain: supply | Understand metered generation, imports, storage and grid frequency. |
| 02 | Britain: demand | Compare observed demand over time and explore a separate annual consumption layer. |
| 03 | Your area | Enter an outward postcode, inspect modelled regional supply and nearby generation sites. |
| 04 | History and outlook | Distinguish recorded observations from future demand, wind and carbon forecasts, with operational context. |
| 05 | Your tariff | Enter real household rates and understand why wholesale prices differ from retail rates. |
| 06 | Task planner | Compare the cost and carbon of a flexible task across valid published time windows. |
| 07 | Your usage | Optionally import readings to inspect consumption, cost and night-time baseline usage. |
| 08 | Your plan | Review explainable actions and optional reminders, including a narrow responsive companion view. |

## Proposed design decisions

- Preserve the approved top-down night map, cyan coasts, amber city lights and restrained editorial typography.
- Use three main destinations: Britain, Your area, Your home.
- Keep map-led national and regional views. Give household tools a calmer analysis workspace.
- National current observations, annual local demand and personal consumption are distinct views with explicit sources and time coverage.
- Nearby generators do not imply that those sites directly supply a particular address.
- Site capacity is distinct from measured output, which is unavailable where no matching observations exist.
- Wholesale prices are shown separately from household tariff rates and standing charges.
- Cheapest and lowest-carbon windows may differ. Forecasts and unpublished prices are not interchangeable.
- Moving the same consumption on a single-rate tariff yields zero direct unit-rate savings.
- Savings are estimates from stated inputs; they are not guarantees.
- Meter totals do not identify individual appliances. Personal data import and meter connection are optional.
- Reminders default off; the proposal does not automatically control appliances.

## Image-generation brief / condensed prompt set

Created with the built-in image generation tool, using the previously approved static top-down design as the visual reference. Four portrait sheets each contain two large desktop frames, scene numbers, a short transition caption and visible DESIGN CONCEPT / SAMPLE DATA labels. These are generated bitmap mockups, not screenshots of implemented features.

Shared art direction: midnight navy; flat, geographically credible north-up Britain; luminous cyan coastlines and subdued amber cities; elegant serif headings; slim glass-like controls; no globe, tilt, raised terrain, device bezels or dashboard card grid. Consistent GRID / ALIVE brand and Britain / Your area / Your home navigation. Retain source and methodology access.

Sheet 1 prompt: scene 01 supply map with a consistent sample fuel mix, separate net imports/storage and a modest grid-frequency readout; scene 02 observed/forecast demand curves with a separate, explicitly annual domestic/non-domestic consumption view.

Sheet 2 prompt: scene 03 postcode-led regional carbon and generation mix plus dated nearby-site details, with no direct-supply claim; scene 04 past-observation and future-forecast timeline with demand, wind and carbon traces and expandable operational notices.

Sheet 3 prompt: scene 05 manual or supported-supplier tariff setup, separate wholesale market example and household unit rates/standing charge; scene 06 a 2 kWh task at example rates of 30p versus 10p per kWh, yielding 60p versus 20p and an estimated 40p saving. Show different cheapest and lower-carbon windows and the zero timing-saving case for single-rate tariffs.

Sheet 4 prompt: scene 07 illustrative imported half-hour readings, consumption/cost traces and night-time baseline insight without appliance-identification claims; scene 08 explainable action list, expandable task savings, a narrow companion preview and reminders switched off.

## Review

Review overall hierarchy, navigation, the relationship between map and household tools, clarity of cost versus carbon, and whether the proposed screens feel coherent with the original design. Implementation and sprint breakdown follow design review.
