import { useEffect, useState } from "react";
import { graphqlClient } from "./client";
import { REFERENCE_DATA_QUERY } from "./queries";
import type { ReferenceData } from "./types";

export type ReferenceDataState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: ReferenceData };

/**
 * Fetches properties and operators from the GraphQL API exactly once on
 * mount. This is static reference data for the session — unlike products,
 * it never depends on the condition the user is building, so there's
 * nothing to refetch.
 */
export function useReferenceData(): ReferenceDataState {
  const [state, setState] = useState<ReferenceDataState>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;
    setState({ status: "loading" });

    graphqlClient
      .request<ReferenceData>(REFERENCE_DATA_QUERY)
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
