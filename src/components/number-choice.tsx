/** Presets keep the main journey selectable; exact values are an optional refinement. */
export function NumberChoice({
  id,
  label,
  value,
  onChange,
  values,
  unit,
  min,
  max,
  step = 0.01,
  scenario = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  values: number[];
  unit: string;
  min: number;
  max: number;
  step?: number;
  scenario?: boolean;
}) {
  const choices = values.map(String),
    custom = value !== "" && !choices.includes(value);
  return (
    <div className="number-choice">
      <label htmlFor={id}>
        {label}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Choose an amount</option>
          {choices.map((v) => (
            <option key={v} value={v}>
              {v} {unit}
              {scenario ? " · example scenario" : ""}
            </option>
          ))}
          {custom && (
            <option value={value}>
              {value} {unit} · exact amount
            </option>
          )}
        </select>
      </label>
      <details className="exact-choice">
        <summary>Use an exact amount</summary>
        <label htmlFor={id + "-exact"}>
          {label} · exact
          <input
            id={id + "-exact"}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </details>
    </div>
  );
}
