import type { OperatorId, PropertyType } from "../api/types";

/**
 * The operator validity matrix:
 *
 * | Property Type | Valid Operators                                  |
 * | -------------- | ------------------------------------------------- |
 * | string         | equals, contains, any, none, in                    |
 * | number         | equals, greater_than, less_than, any, none, in     |
 * | enumerated     | equals, any, none, in                              |
 *
 * `contains`, `greater_than`, and `less_than` never apply to `enumerated`;
 * `greater_than`/`less_than` never apply to `string`; `contains` never
 * applies to `number`.
 */
const VALID_OPERATORS_BY_TYPE: Record<PropertyType, OperatorId[]> = {
  string: ["equals", "contains", "any", "none", "in"],
  number: ["equals", "greater_than", "less_than", "any", "none", "in"],
  enumerated: ["equals", "any", "none", "in"],
};

export function getValidOperatorIds(type: PropertyType): OperatorId[] {
  return VALID_OPERATORS_BY_TYPE[type];
}

export function isOperatorValidForType(
  operatorId: OperatorId,
  type: PropertyType,
): boolean {
  return VALID_OPERATORS_BY_TYPE[type].includes(operatorId);
}

/** Operators that take no value at all ("Has any value" / "Has no value"). */
export function operatorTakesValue(operatorId: OperatorId): boolean {
  return operatorId !== "any" && operatorId !== "none";
}

/** Operators whose value is a list of values ("Is any of"). */
export function operatorTakesMultipleValues(operatorId: OperatorId): boolean {
  return operatorId === "in";
}
