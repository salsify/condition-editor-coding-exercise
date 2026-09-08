import type { Operator, OperatorId, Property } from "../api/types";
import type { Condition, ConditionValue } from "../domain/filter";
import { getValidOperatorIds, operatorTakesValue } from "../domain/operators";
import { ValueInput } from "./ValueInput";

interface ConditionEditorProps {
  properties: Property[];
  operators: Operator[];
  condition: Condition | null;
  onConditionChange: (condition: Condition | null) => void;
  onClear: () => void;
}

/**
 * The `[property] [operator] [value]` filter builder. The operator options
 * are always filtered down to what's valid for the currently selected
 * property's data type, and the value input adapts to both.
 */
export function ConditionEditor({
  properties,
  operators,
  condition,
  onConditionChange,
  onClear,
}: ConditionEditorProps) {
  const selectedProperty =
    properties.find((p) => p.id === condition?.propertyId) ?? null;

  const availableOperators = selectedProperty
    ? operators.filter((op) =>
        getValidOperatorIds(selectedProperty.type).includes(op.id),
      )
    : [];

  const handlePropertyChange = (propertyIdText: string) => {
    if (propertyIdText === "") {
      onConditionChange(null);
      return;
    }
    const property = properties.find((p) => p.id === Number(propertyIdText));
    if (!property) return;
    // Reset the operator/value whenever the property changes, since the
    // previous operator may no longer be valid for the new property's type.
    const [defaultOperatorId] = getValidOperatorIds(property.type);
    onConditionChange({
      propertyId: property.id,
      operatorId: defaultOperatorId,
      value: undefined,
    });
  };

  const handleOperatorChange = (operatorId: string) => {
    if (!condition) return;
    onConditionChange({
      ...condition,
      operatorId: operatorId as OperatorId,
      value: undefined,
    });
  };

  const handleValueChange = (value: ConditionValue) => {
    if (!condition) return;
    onConditionChange({ ...condition, value });
  };

  return (
    <fieldset className="condition-editor">
      <legend>Filter products</legend>

      <label className="condition-editor__field">
        <span>Property</span>
        <select
          aria-label="Property"
          value={condition?.propertyId ?? ""}
          onChange={(e) => handlePropertyChange(e.target.value)}
        >
          <option value="">Select a property…</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </label>

      {selectedProperty && condition && (
        <label className="condition-editor__field">
          <span>Operator</span>
          <select
            aria-label="Operator"
            value={condition.operatorId}
            onChange={(e) => handleOperatorChange(e.target.value)}
          >
            {availableOperators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.text}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedProperty &&
        condition &&
        operatorTakesValue(condition.operatorId) && (
          <div className="condition-editor__field">
            <span>Value</span>
            <ValueInput
              // Remount whenever the property or operator changes so
              // ValueInput's internal free-text state (for the `in`
              // operator's comma-separated list inputs) starts fresh
              // instead of carrying over text from a different
              // property/operator.
              key={`${selectedProperty.id}-${condition.operatorId}`}
              property={selectedProperty}
              operatorId={condition.operatorId}
              value={condition.value}
              onChange={handleValueChange}
            />
          </div>
        )}

      <button type="button" onClick={onClear} disabled={!condition}>
        Clear filter
      </button>
    </fieldset>
  );
}
