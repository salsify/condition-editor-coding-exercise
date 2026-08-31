import { GraphQLClient } from "graphql-request";

/**
 * `fetch` requires an absolute URL both in the browser under some
 * environments and, notably, under Node (which is what Vitest runs in,
 * even with `environment: "jsdom"`) — a bare "/graphql" throws "Invalid
 * URL" there. MSW's `graphql.query(...)` handlers match by GraphQL
 * operation name regardless of the request URL, so this placeholder host
 * never actually needs to be reachable; swap it for a real endpoint (e.g.
 * via an env var) when pointing this app at a real GraphQL server.
 */
export const GRAPHQL_ENDPOINT = "http://localhost/graphql";

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT);
