import { graphql, HttpResponse } from "msw";
import { mockCatalog } from "./data";
import { filterProducts } from "../domain/filter";
import type { ConditionInput, Product } from "../api/types";

/**
 * MSW intercepts GraphQL operations by name (regardless of endpoint URL).
 * These handlers are shared between the browser worker (dev) and the node
 * server (tests) so both exercise the exact same mocked API surface.
 *
 * Filtering now lives here, not in the client: `products` takes an
 * optional `condition` and returns only the matching products, reusing
 * `filterProducts`/`evaluateCondition` from `domain/filter` — the same
 * matching semantics as before, just invoked at mock-response time instead
 * of at client-render time. `filterProducts` already treats a missing
 * condition as "return everything", so a request with no `condition`
 * variable (or an explicit `null`) naturally returns the full list.
 */
export const handlers = [
  graphql.query("ReferenceData", () => {
    return HttpResponse.json({
      data: {
        properties: mockCatalog.properties,
        operators: mockCatalog.operators,
      },
    });
  }),

  graphql.query<{ products: Product[] }, { condition?: ConditionInput | null }>(
    "Products",
    ({ variables }) => {
      const products = filterProducts(
        mockCatalog.products,
        variables.condition ?? null,
        mockCatalog.properties,
      );
      return HttpResponse.json({ data: { products } });
    },
  ),
];
