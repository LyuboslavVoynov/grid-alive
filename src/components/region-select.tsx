import { gridRegions } from "@/lib/geo/regions";
export function RegionSelect({
  value,
  onChange,
  id,
  label = "Electricity region",
  disabled = false,
  national = false,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  label?: string;
  disabled?: boolean;
  national?: boolean;
}) {
  return (
    <label className="region-select" htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={!national}
      >
        <option value="">
          {national
            ? "Great Britain · national forecast"
            : "Choose your region"}
        </option>
        {gridRegions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}
