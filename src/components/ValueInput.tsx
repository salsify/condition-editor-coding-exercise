import type { OperatorId, Property } from "../api/types";
import type { ConditionValue } from "../domain/filter";

interface ValueInputProps {
  property: Property;
  operatorId: OperatorId;
  value: ConditionValue;
  onChange: (value: ConditionValue) => void;
}

function parseStringList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseNumberList(text: string): number[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

/**
 * Renders the value input appropriate for the selected property's data
 * type and operator: no input for `any`/`none`, a `<select>` (or a
 * checkbox group for `in`) for enumerated properties, a number input for
 * numeric properties, and a text input for strings (comma-separated for
 * `in`, matching the README's `Headphones, Keys` example).
 */
export function ValueInput({
  property,
  operatorId,
  value,
  onChange,
}: ValueInputProps) {
  if (operatorId === "any" || operatorId === "none") {
    return null;
  }

  if (property.type === "enumerated") {
    const options = property.values ?? [];

    if (operatorId === "in") {
      const selected = Array.isArray(value) ? value.map(String) : [];
      const toggle = (option: string) => {
        const next = selected.includes(option)
          ? selected.filter((v) => v !== option)
          : [...selected, option];
        onChange(next);
      };
      return (
        <div
          className="value-input value-input--checkbox-group"
          role="group"
          aria-label="Value"
        >
          {options.map((option) => (
            <label key={option} className="value-input__checkbox-label">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <select
        aria-label="Value"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select a value…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (property.type === "number") {
    if (operatorId === "in") {
      const text = Array.isArray(value) ? value.join(", ") : "";
      return (
        <input
          type="text"
          aria-label="Value"
          placeholder="e.g. 3, 5, 19"
          value={text}
          onChange={(e) => onChange(parseNumberList(e.target.value))}
        />
      );
    }
    return (
      <input
        type="number"
        aria-label="Value"
        value={typeof value === "number" ? value : ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    );
  }

  // string
  if (operatorId === "in") {
    const text = Array.isArray(value) ? value.join(", ") : "";
    return (
      <input
        type="text"
        aria-label="Value"
        placeholder="e.g. Headphones, Keyboard"
        value={text}
        onChange={(e) => onChange(parseStringList(e.target.value))}
      />
    );
  }
  return (
    <input
      type="text"
      aria-label="Value"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
