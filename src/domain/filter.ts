import type { OperatorId, Product, Property } from "../api/types";

export type ConditionValue = string | number | (string | number)[] | undefined;

export interface Condition {
  propertyId: number;
  operatorId: OperatorId;
  value?: ConditionValue;
}

function getRawValue(
  product: Product,
  propertyId: number,
): string | number | undefined {
  return product.propertyValues.find((pv) => pv.propertyId === propertyId)
    ?.value;
}

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * Evaluates a single condition against a single product for the property it
 * targets. `property` must be the `Property` definition that
 * `condition.propertyId` refers to (its `type` drives how values are
 * compared — e.g. numeric vs. string comparison for `equals`/`in`).
 */
export function evaluateCondition(
  product: Product,
  condition: Condition,
  property: Property,
): boolean {
  const raw = getRawValue(product, condition.propertyId);

  switch (condition.operatorId) {
    case "any":
      return raw !== undefined;

    case "none":
      return raw === undefined;

    case "equals": {
      if (raw === undefined || condition.value === undefined) return false;
      if (property.type === "number") {
        return toNumber(raw) === toNumber(condition.value as string | number);
      }
      return String(raw) === String(condition.value);
    }

    case "contains": {
      if (raw === undefined || condition.value === undefined) return false;
      // Case-insensitive substring match — see SOLUTION.md "Assumptions".
      return String(raw)
        .toLowerCase()
        .includes(String(condition.value).toLowerCase());
    }

    case "greater_than": {
      if (raw === undefined || condition.value === undefined) return false;
      return toNumber(raw) > toNumber(condition.value as string | number);
    }

    case "less_than": {
      if (raw === undefined || condition.value === undefined) return false;
      return toNumber(raw) < toNumber(condition.value as string | number);
    }

    case "in": {
      if (raw === undefined) return false;
      const candidates = Array.isArray(condition.value) ? condition.value : [];
      if (candidates.length === 0) return false;
      if (property.type === "number") {
        const rawNumber = toNumber(raw);
        return candidates.some((candidate) => toNumber(candidate) === rawNumber);
      }
      return candidates.some((candidate) => String(candidate) === String(raw));
    }

    default:
      return false;
  }
}

/**
 * Filters `products` down to those matching `condition`, or returns them
 * unchanged when there is no condition (the "clear filter" state) or the
 * condition's property can't be resolved.
 */
export function filterProducts(
  products: Product[],
  condition: Condition | null | undefined,
  properties: Property[],
): Product[] {
  if (!condition) return products;
  const property = properties.find((p) => p.id === condition.propertyId);
  if (!property) return products;
  return products.filter((product) =>
    evaluateCondition(product, condition, property),
  );
}
