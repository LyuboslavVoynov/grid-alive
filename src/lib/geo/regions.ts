/** NESO Carbon Intensity region IDs mapped to the licensed DNO area's GSP code.
 * Mapping is shared with scripts/prepare-geography.mjs, not inferred from postcode or supplier.
 */
export const gridRegions = [
  { id: 1, name: "North Scotland", tariffLetter: "P" },
  { id: 2, name: "South and Central Scotland", tariffLetter: "N" },
  { id: 3, name: "North West England", tariffLetter: "G" },
  { id: 4, name: "North East England", tariffLetter: "F" },
  { id: 5, name: "Yorkshire", tariffLetter: "M" },
  { id: 6, name: "North Wales, Merseyside and Cheshire", tariffLetter: "D" },
  { id: 7, name: "South Wales", tariffLetter: "K" },
  { id: 8, name: "West Midlands", tariffLetter: "E" },
  { id: 9, name: "East Midlands", tariffLetter: "B" },
  { id: 10, name: "East England", tariffLetter: "A" },
  { id: 11, name: "South West England", tariffLetter: "L" },
  { id: 12, name: "Southern England", tariffLetter: "H" },
  { id: 13, name: "London", tariffLetter: "C" },
  { id: 14, name: "South East England", tariffLetter: "J" },
] as const;
export function validRegionId(input: string) {
  if (!/^\d{1,2}$/.test(input))
    throw Error("Choose a supported GB electricity region.");
  const id = Number(input);
  if (!gridRegions.some((r) => r.id === id))
    throw Error("Choose a supported GB electricity region.");
  return id;
}
export function tariffForRegion(codes: string[], input: string) {
  const region = gridRegions.find((r) => String(r.id) === input);
  if (!region) return null;
  const matches = codes.filter((code) =>
    code.endsWith("-" + region.tariffLetter),
  );
  return matches.length === 1 ? matches[0] : null;
}
