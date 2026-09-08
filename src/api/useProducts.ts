import { useEffect, useState } from "react";
import { graphqlClient } from "./client";
import { PRODUCTS_QUERY } from "./queries";
import type { ConditionInput, Product } from "./types";
import { isConditionComplete, type Condition } from "../domain/filter";

export type ProductsState =
  | { status: "loading"; products: Product[] }
  | { status: "error"; error: Error; products: Product[] }
  | { status: "success"; products: Product[] };

/**
 * `condition` is only sent to the server once it's actually complete (see
 * `isConditionComplete`) — a property-only or value-less condition isn't
 * something the server can filter on, and the client's intent while
 * building one is still "show me everything".
 */
function toConditionInput(
  condition: Condition | null,
): ConditionInput | undefined {
  return isConditionComplete(condition)
    ? (condition as ConditionInput)
    : undefined;
}

/**
 * Fetches products for the current `condition` via the `products` query —
 * the server does the filtering (see `src/mocks/handlers.ts`), the client
 * just renders whatever comes back. Refetches whenever the *effective*
 * condition (the one actually sent to the server) changes; building an
 * incomplete condition doesn't trigger a new request since the server call
 * would be identical to "no condition" either way.
 *
 * The previous products stay visible while a refetch is in flight, so the
 * table doesn't flash empty on every keystroke.
 */
export function useProducts(condition: Condition | null): ProductsState {
  const conditionInput = toConditionInput(condition);
  const conditionKey = conditionInput ? JSON.stringify(conditionInput) : "";

  const [state, setState] = useState<ProductsState>({
    status: "loading",
    products: [],
  });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ status: "loading", products: previous.products }));

    graphqlClient
      .request<{ products: Product[] }>(PRODUCTS_QUERY, {
        condition: conditionInput,
      })
      .then((data) => {
        if (isMounted) setState({ status: "success", products: data.products });
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState((previous) => ({
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
            products: previous.products,
          }));
        }
      });

    return () => {
      isMounted = false;
    };
    // Re-run only when the effective condition (conditionKey) changes —
    // conditionInput itself is derived fresh from it every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionKey]);

  return state;
}
