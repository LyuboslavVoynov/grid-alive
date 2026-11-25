export function MobileIcon({
  name,
}: {
  name:
    "overview" | "demand" | "forecast" | "costs" | "energy" | "map" | "more";
}) {
  const paths = {
    overview: "M20 12a8 8 0 1 1-8-8v8h8ZM15 3v6h6a8 8 0 0 0-6-6Z",
    demand: "M4 19V12m5 7V5m6 14V9m5 10V3",
    forecast: "M4 17c3-8 5 3 8-5s5 0 8-7M4 21h16",
    costs: "M15 5c-6-4-9 0-7 6v7m-3-7h10M5 19h12",
    energy: "M13 2 5 13h6l-1 9 9-12h-6l1-8Z",
    map: "m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5Zm6-2v15m6-12v15",
    more: "M5 12h.01M12 12h.01M19 12h.01",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
