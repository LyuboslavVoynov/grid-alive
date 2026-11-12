export default function Methodology() {
  return (
    <article className="document">
      <a href="/">← Return to GRID / ALIVE</a>
      <h1>Sources & methodology</h1>
      <h2>Generation and storage</h2>
      <p>
        Generation uses Elexon FUELINST five-minute observations. The total and
        percentage denominator are the sum of reported domestic metered
        generation categories, excluding interconnectors and pumped storage. Gas
        combines CCGT and OCGT. Coal, oil and new provider categories are
        retained when reported. Percentages may differ slightly from 100% after
        display rounding.
      </p>
      <p>
        This is not a comprehensive whole-system generation mix: embedded
        generation is not fully represented. Solar is not separately reported in
        this feed and is shown as unavailable, never assumed to be zero.
        Pumped-storage output is separate; a negative value denotes pumping.
      </p>
      <h2>Demand and international connections</h2>
      <p>
        Demand uses Elexon Initial National Demand Outturn (INDO), reported for
        half-hour settlement periods. It has different timing and methodology
        from FUELINST. We do not force generation plus net imports to equal this
        demand figure. Interconnector signs follow the provider: positive values
        indicate imports to Great Britain, negative values exports. Net imports
        are the sum of available reported links.
      </p>
      <h2>Carbon intensity</h2>
      <p>
        NESO’s Carbon Intensity API supplies system-wide modelled estimates and
        forecasts in gCO₂/kWh. A published actual value is displayed as an
        estimate; when absent, a forecast is explicitly labelled. Its coverage
        and method differ from the metered generation table.
      </p>
      <h2>Timing, caching and outages</h2>
      <p>
        Observation time and retrieval time are stored separately, in UTC.
        Display times use Europe/London, including daylight saving. Generation
        is refreshed at most once a minute per running server process, and
        demand/carbon at most every five minutes. Values are labelled delayed
        when older than their freshness thresholds, or when cached values are
        used after provider failure. The cache is process-local; a cold server
        during an outage shows unavailable data. No fictional fallback
        measurements are used.
      </p>
      <h2>Geography and motion</h2>
      <p>
        Coastlines are simplified Natural Earth 1:10m country geometry, in the
        public domain. City illumination is procedural artwork, not satellite
        imagery or transmission infrastructure. Selected renewable site
        reference points come from DESNZ’s REPD July 2026 snapshot: the largest
        30 operational offshore projects and largest 15 in each included onshore
        wind, solar PV, large/small hydro and dedicated biomass category,
        restricted to England, Scotland and Wales. This is not a complete
        station inventory. Capacity and status are dated source facts, not
        current output. Coordinates use an approximate OSGB36-to-WGS84
        conversion. Turbine symbols do not depict individual turbine positions
        or the recorded turbine count. Energy paths remain illustrative.
        National wind observations affect visual activity; they do not establish
        individual turbine speed or farm output. International routes are
        schematic, with direction driven by reported link measurements.
      </p>
      <h2>Renewable-site attribution</h2>
      <p>
        Contains public sector information licensed under the Open Government
        Licence v3.0. © Crown copyright 2026.{" "}
        <a href="https://www.gov.uk/government/publications/renewable-energy-planning-database-quarterly-extract">
          DESNZ Renewable Energy Planning Database
        </a>
        .
      </p>
      <h2>Regional carbon and replay</h2>
      <p>
        Regional values are NESO forecasts/modelled estimates, shown over
        approximate NESO DNO licence areas (20240503), simplified for rendering.
        Supported by National Energy SO Open Data. Borders are not exact or
        guaranteed current. Regional source IDs are explicitly mapped to the
        Carbon Intensity API regions.
      </p>
      <p>
        Replay samples observations at half-hour steps over the preceding 24
        complete settlement periods. Each layer uses observations valid at the
        selected UTC instant; gaps remain unavailable. A historical generation
        observation is not labelled stale simply because it is historical.
        Geographic asset metadata remains the dated REPD snapshot; replay does
        not claim to reconstruct historical site operational status. Display
        times include date and GMT/BST to distinguish repeated local clock
        hours.
      </p>
      <p>
        <a href="https://www.neso.energy/data-portal/gis-boundaries-gb-dno-license-areas">
          NESO boundary source
        </a>{" "}
        ·{" "}
        <a href="https://www.neso.energy/data-portal/neso-open-licence">
          NESO Open Data Licence
        </a>
        .
      </p>
      <h2>Scope</h2>
      <p>
        Electricity totals cover Great Britain. Northern Ireland is a separate
        electricity system and is not included in GB generation totals;
        transfers to or from Northern Ireland can appear as interconnector
        measurements. Household costs use the separate v2 tariff and planning
        tools described below.
      </p>
      <h2>Demand trends, frequency and outlook</h2>
      <p>
        Elexon INDO supplies observed national demand. Comparisons align
        settlement intervals 24 hours apart in UTC, which can differ from the
        same local clock time on daylight-saving transitions. The demand and
        wind outlook uses published national demand and wind generation
        forecasts, with independent coverage. NESO supplies up to 48 hours of
        carbon forecasts. A forecast is uncertain and gaps remain unavailable.
        Grid frequency is a timestamped Elexon observation around a nominal 50
        Hz; it is not an assurance about local outages.
      </p>
      <p>
        Station context shows up to five latest published REMIT messages
        overlapping the selected future window. It is a selected set, not a
        comprehensive outage or station-status feed. Event status and timing
        matter. Declared unavailable capacity is not metered station output or a
        prediction of household supply interruptions.
      </p>
      <h2>Your area and annual consumption</h2>
      <p>
        The main location journey selects one of fourteen electricity regions;
        no postcode or address is needed. NESO supplies a modelled regional mix,
        including imports and embedded generation, which differs from the
        national metered generation table. The map focuses on the approximate
        DNO area's bounding-box centre. Featured-project distances are from that
        reference point, not from your home. Postal, local-authority and
        grid-region boundaries differ. A separate legacy postcode API remains
        available and sends only an outward code to NESO and Postcodes.io; it is
        not used by the region-selection journey.
      </p>
      <p>
        DESNZ 2024 local authority consumption is annual metered-consumption
        estimates, classified as domestic and non-domestic, not live city or
        sector demand. Non-domestic includes businesses, industry and public
        services. Mean domestic kWh per meter is context, not a household
        efficiency target. Postal, local-authority and electricity-region
        boundaries are different. Contains public sector information licensed
        under the Open Government Licence v3.0, © Crown copyright 2025.{" "}
        <a href="https://www.gov.uk/government/statistical-data-sets/stacked-electricity-consumption-statistics-data">
          Official annual dataset
        </a>
        . Postcode geographic data contains OS and ONS open data; see{" "}
        <a href="https://postcodes.io/about/">Postcodes.io attribution</a>.
      </p>
      <h2>Household tariffs and wholesale context</h2>
      <p>
        Manual rates are entered in VAT-inclusive p/kWh and standing charges in
        p/day. Two-rate schedules repeat daily in Europe/London, including clock
        changes. More complicated schedules, discounts and personalised smart
        charging rewards are not inferred. The public Octopus integration loads
        an Agile import tariff selected by supplier, published version and
        region name for direct-debit payment, without signing into an account or
        switching supplier. It uses value_inc_vat and each rate's validity
        interval. Rates are available for at most the previous 14 days and next
        48 hours, limited to periods actually published. The current standing
        charge is used, not a historical charge schedule.
      </p>
      <p>
        The separate Elexon APXMIDP market index includes observations with
        positive traded volume, in £/MWh. Dividing by 10 gives the equivalent
        energy-only p/kWh scale. This is not a retail tariff or a future price
        forecast; household rates also reflect networks, policy costs, supplier
        costs, VAT and standing charges.
      </p>
      <h2>Task planning and estimates</h2>
      <p>
        The planner integrates an assumed constant-power task across fully
        covered rate and carbon intervals. Task presets are editable examples,
        not observed appliance use. Starts are aligned to half hours; the task
        must finish before the selected deadline, within 48 hours. Any price or
        carbon gap produces an unknown result, never a zero. A single-rate
        tariff yields no direct unit-charge saving for shifting the same energy.
        Standing charges are excluded from timing comparisons. The cheapest and
        lowest-carbon windows are independent and may differ.
      </p>
      <p>
        Annual comparison scenarios use user-entered annual kWh, stated off-peak
        assumptions where relevant, unchanged rates and 365 standing charges.
        They exclude exit fees, discounts, rewards and future changes; they are
        not quotes or eligibility checks. Unpublished dynamic prices cannot
        support a reliable annual projection.
      </p>
      <p>
        The main controls use selections for regions, supplier tariffs, task
        presets and example annual assumptions. Task and annual numeric presets
        are illustrative inputs, not measured appliance use, personal
        consumption or supplier offers. Optional exact-value fields refine those
        assumptions. Without a tariff, carbon-only planning is available while
        household costs and savings remain unknown. Selecting a supplier does
        not grant access to a personal meter.
      </p>
      <h2>Personal readings and privacy</h2>
      <p>
        Consumption CSV files are parsed in your browser and never uploaded.
        Aligned half-hour import energy in kWh and explicit-offset ISO
        timestamps are required. Negative readings, future readings, duplicate
        and overlapping intervals are rejected. Missing readings remain missing;
        a complete London day contains 46, 48 or 50 half-hour intervals
        depending on clock changes. Period comparisons require complete days.
        Imported readings are priced using the selected tariff, which may differ
        from your historical bill.
      </p>
      <p>
        Energy costs and current daily standing charges are separate. Standing
        charges count each calendar day represented, even if its readings are
        incomplete. The overnight baseline is the median half-hour power from
        midnight to 05:00, using at least six readings. Meter totals cannot
        identify individual appliances or establish that the baseline is
        avoidable.
      </p>
      <p>
        The workspace lives in memory by default. You can opt into local browser
        storage for rates, readings and saved windows, or clear it.
        Authenticated meter linking is not configured. In-page reminders work
        while My plan is open; calendar exports let your calendar manage
        notifications. No push notification service or automatic appliance
        control is connected.
      </p>
      <h2>Attribution and source documentation</h2>
      <ul>
        <li>
          <a href="https://developer.data.elexon.co.uk/">Elexon Insights API</a>{" "}
          — contains BMRS data © Elexon Limited copyright and database right
          2026. See the{" "}
          <a href="https://www.elexon.co.uk/data/balancing-mechanism-reporting-agent/">
            BMRS data licence
          </a>
          .
        </li>
        <li>
          <a href="https://carbon-intensity.github.io/api-definitions/">
            NESO Carbon Intensity API
          </a>{" "}
          — CC BY 4.0; estimates and forecasts.
        </li>
        <li>
          <a href="https://www.naturalearthdata.com/about/terms-of-use/">
            Natural Earth
          </a>{" "}
          — public-domain map geometry.
        </li>
      </ul>
    </article>
  );
}
