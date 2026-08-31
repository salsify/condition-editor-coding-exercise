import { graphql, HttpResponse } from "msw";
import { mockCatalog } from "./data";

/**
 * MSW intercepts the `Catalog` GraphQL operation (matched by operation
 * name, regardless of endpoint URL) and resolves it with the mock dataset.
 * These handlers are shared between the browser worker (dev) and the node
 * server (tests) so both exercise the exact same mocked API surface.
 */
export const handlers = [
  graphql.query("Catalog", () => {
    return HttpResponse.json({ data: mockCatalog });
  }),
];
