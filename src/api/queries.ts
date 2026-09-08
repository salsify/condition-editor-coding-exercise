/**
 * Properties and operators are static reference data for the session —
 * fetched once, up front, independent of any condition the user builds.
 */
export const REFERENCE_DATA_QUERY = /* GraphQL */ `
  query ReferenceData {
    properties {
      id
      name
      type
      values
    }
    operators {
      id
      text
    }
  }
`;

/**
 * Products are fetched (and filtered) per the current condition: the
 * server applies `condition` and returns only matching products. Called
 * with `condition` omitted/null, it returns the full, unfiltered list —
 * which is exactly how the client calls it while the condition being built
 * in the UI isn't complete yet (see `isConditionComplete`).
 */
export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($condition: ConditionInput) {
    products(condition: $condition) {
      id
      propertyValues {
        propertyId
        value
      }
    }
  }
`;
