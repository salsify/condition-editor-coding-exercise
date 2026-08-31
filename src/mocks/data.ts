import type { CatalogData } from "../api/types";

/**
 * Reimplements the dataset from `reference/datastore.js` behind the mocked
 * GraphQL API (see `handlers.ts`). Field names are camelCased for GraphQL
 * convention (`property_id` -> `propertyId`) but the ids, names, types, and
 * values are otherwise identical — including products 3-5 (Cup, Key,
 * Hammer) deliberately omitting a `wireless` property value, which is the
 * dataset's test case for the `any`/`none` operators.
 */
export const mockCatalog: CatalogData = {
  properties: [
    { id: 0, name: "Product Name", type: "string" },
    { id: 1, name: "color", type: "string" },
    { id: 2, name: "weight (oz)", type: "number" },
    {
      id: 3,
      name: "category",
      type: "enumerated",
      values: ["tools", "electronics", "kitchenware"],
    },
    { id: 4, name: "wireless", type: "enumerated", values: ["true", "false"] },
  ],

  operators: [
    { id: "equals", text: "Equals" },
    { id: "greater_than", text: "Is greater than" },
    { id: "less_than", text: "Is less than" },
    { id: "any", text: "Has any value" },
    { id: "none", text: "Has no value" },
    { id: "in", text: "Is any of" },
    { id: "contains", text: "Contains" },
  ],

  products: [
    {
      id: 0,
      propertyValues: [
        { propertyId: 0, value: "Headphones" },
        { propertyId: 1, value: "black" },
        { propertyId: 2, value: 5 },
        { propertyId: 3, value: "electronics" },
        { propertyId: 4, value: "false" },
      ],
    },
    {
      id: 1,
      propertyValues: [
        { propertyId: 0, value: "Cell Phone" },
        { propertyId: 1, value: "black" },
        { propertyId: 2, value: 3 },
        { propertyId: 3, value: "electronics" },
        { propertyId: 4, value: "true" },
      ],
    },
    {
      id: 2,
      propertyValues: [
        { propertyId: 0, value: "Keyboard" },
        { propertyId: 1, value: "grey" },
        { propertyId: 2, value: 5 },
        { propertyId: 3, value: "electronics" },
        { propertyId: 4, value: "false" },
      ],
    },
    {
      id: 3,
      propertyValues: [
        { propertyId: 0, value: "Cup" },
        { propertyId: 1, value: "white" },
        { propertyId: 2, value: 3 },
        { propertyId: 3, value: "kitchenware" },
        // no `wireless` value on purpose
      ],
    },
    {
      id: 4,
      propertyValues: [
        { propertyId: 0, value: "Key" },
        { propertyId: 1, value: "silver" },
        { propertyId: 2, value: 1 },
        { propertyId: 3, value: "tools" },
        // no `wireless` value on purpose
      ],
    },
    {
      id: 5,
      propertyValues: [
        { propertyId: 0, value: "Hammer" },
        { propertyId: 1, value: "brown" },
        { propertyId: 2, value: 19 },
        { propertyId: 3, value: "tools" },
        // no `wireless` value on purpose
      ],
    },
  ],
};
