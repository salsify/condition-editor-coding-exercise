import { useEffect, useState } from "react";
import { graphqlClient } from "./client";
import { CATALOG_QUERY } from "./queries";
import type { CatalogData } from "./types";

export type CatalogState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: CatalogData };

/**
 * Fetches the full product catalog (properties, operators, products) from
 * the GraphQL API exactly once on mount. There are no arguments/variables
 * and no refetching — the condition editor filters the already-fetched
 * product list client-side as the user edits it.
 */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    setState({ status: "loading" });

    graphqlClient
      .request<CatalogData>(CATALOG_QUERY)
      .then((data) => {
        if (isMounted) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
