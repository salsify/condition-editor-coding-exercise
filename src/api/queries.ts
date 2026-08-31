/**
 * A single query fetches the full catalog (properties, operators, and
 * products) once. The dataset is small and static per session — filtering
 * as the user builds a condition happens client-side (see `domain/filter.ts`)
 * rather than round-tripping to the server on every keystroke, matching the
 * spirit of the original in-browser `datastore.js` exercise.
 */
export const CATALOG_QUERY = /* GraphQL */ `
  query Catalog {
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
    products {
      id
      propertyValues {
        propertyId
        value
      }
    }
  }
`;
