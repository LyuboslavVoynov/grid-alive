/** Reported link codes grouped by connected grid; never inferred from coordinates. */
export const interconnectors: {
  id: string;
  country: string;
  flag: string;
  name: string;
}[] = [
  {
    id: "INTFR",
    country: "France",
    flag: "🇫🇷",
    name: "IFA",
  },
  {
    id: "INTIFA2",
    country: "France",
    flag: "🇫🇷",
    name: "IFA2",
  },
  {
    id: "INTELEC",
    country: "France",
    flag: "🇫🇷",
    name: "ElecLink",
  },
  {
    id: "INTNED",
    country: "Netherlands",
    flag: "🇳🇱",
    name: "BritNed",
  },
  {
    id: "INTNEM",
    country: "Belgium",
    flag: "🇧🇪",
    name: "Nemo Link",
  },
  {
    id: "INTNSL",
    country: "Norway",
    flag: "🇳🇴",
    name: "North Sea Link",
  },
  {
    id: "INTVKL",
    country: "Denmark",
    flag: "🇩🇰",
    name: "Viking Link",
  },
  {
    id: "INTEW",
    country: "Ireland",
    flag: "🇮🇪",
    name: "East-West",
  },
  {
    id: "INTGRNL",
    country: "Ireland",
    flag: "🇮🇪",
    name: "Greenlink",
  },
  {
    id: "INTIRL",
    country: "Northern Ireland",
    flag: "",
    name: "Moyle",
  },
];
export type CountryTransfer = {
  country: string;
  flag: string;
  importsMw: number;
  exportsMw: number;
  netMw: number;
  missing: number;
  links: { id: string; name: string; mw: number | null }[];
};
/** Keep gross imports and exports separate: opposite cables must never cancel out of the breakdown. */
export function countryTransfers(
  flows: Record<string, number>,
): CountryTransfer[] {
  const groups = new Map<string, CountryTransfer>();
  for (const link of interconnectors) {
    let group = groups.get(link.country);
    if (!group) {
      group = {
        country: link.country,
        flag: link.flag,
        importsMw: 0,
        exportsMw: 0,
        netMw: 0,
        missing: 0,
        links: [],
      };
      groups.set(link.country, group);
    }
    const value = flows[link.id];
    const mw = Number.isFinite(value) ? value : null;
    group.links.push({ id: link.id, name: link.name, mw });
    if (mw === null) group.missing++;
    else {
      group.importsMw += Math.max(0, mw);
      group.exportsMw += Math.max(0, -mw);
      group.netMw += mw;
    }
  }
  // Preserve unexpected reported codes rather than silently assigning them to a country.
  for (const [id, mw] of Object.entries(flows))
    if (!interconnectors.some((l) => l.id === id) && Number.isFinite(mw))
      groups.set(id, {
        country: `Unmapped link · ${id}`,
        flag: "",
        importsMw: Math.max(0, mw),
        exportsMw: Math.max(0, -mw),
        netMw: mw,
        missing: 0,
        links: [{ id, name: id, mw }],
      });
  return [...groups.values()].sort(
    (a, b) =>
      b.importsMw - a.importsMw ||
      b.exportsMw - a.exportsMw ||
      a.country.localeCompare(b.country),
  );
}
