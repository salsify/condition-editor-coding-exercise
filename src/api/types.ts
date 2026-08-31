/**
 * Types describing the shape of data returned by the mocked GraphQL API.
 * These mirror `reference/schema.graphql` and, in turn, the original
 * `datastore.js` dataset (see `reference/datastore.js`), reimplemented
 * behind a GraphQL layer per the exercise instructions.
 */

export type PropertyType = "string" | "number" | "enumerated";

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  /** Only present (and only meaningful) for `type: "enumerated"`. */
  values?: string[];
}

export interface PropertyValue {
  propertyId: number;
  /** Numeric properties carry a number; string/enumerated carry a string. */
  value: string | number;
}

export interface Product {
  id: number;
  /**
   * Sparse by design: a product may omit a `PropertyValue` entirely for a
   * given property (see products 3-5 in the mock dataset), which is what
   * makes the `any` ("has any value") / `none` ("has no value") operators
   * meaningful.
   */
  propertyValues: PropertyValue[];
}

export type OperatorId =
  | "equals"
  | "greater_than"
  | "less_than"
  | "any"
  | "none"
  | "in"
  | "contains";

export interface Operator {
  id: OperatorId;
  text: string;
}

export interface CatalogData {
  properties: Property[];
  operators: Operator[];
  products: Product[];
}
