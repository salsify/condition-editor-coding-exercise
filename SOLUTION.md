# Solution: Product Filtering Condition Editor

A guided tour of this solution to the [condition editor coding exercise](reference/EXERCISE_README.md).

## Setup / run / test

```sh
npm install
npm run dev        # http://localhost:5173 — MSW mocks the GraphQL API in the browser
npm run test        # unit + component tests (Vitest + React Testing Library, MSW-mocked)
npm run typecheck    # tsc -b, no emit
npm run lint          # oxlint
npm run build          # tsc -b && vite build — production bundle in dist/
```

All four of `test`, `typecheck`, `lint`, and `build` pass as of this commit.

## Guided tour

- **`reference/`** — the original exercise files (`EXERCISE_README.md`, `datastore.js`, `wireframe.pdf`), untouched, kept for context. Nothing in `src/` imports from here; the dataset is reimplemented behind a GraphQL API instead (see below).
- **`src/api/`** — the GraphQL client layer.
  - `types.ts` — TypeScript types for `Property`, `Product`, `Operator`, `ReferenceData`, `ConditionInput`, etc., describing what the mocked API accepts and returns.
  - `queries.ts` — two queries: `ReferenceData` (properties + operators, static) and `Products($condition: ConditionInput)` (the filtered — or, with no condition, full — product list).
  - `client.ts` — a `graphql-request` `GraphQLClient` pointed at a (placeholder) GraphQL endpoint; `request(document, variables)` is what lets `Products` be called parameterized.
  - `useReferenceData.ts` — fetches properties + operators once on mount, exposing `{status: 'loading'|'error'|'success', ...}`.
  - `useProducts.ts` — fetches products for the current `Condition`, refetching whenever the *effective* condition changes (see below).
- **`src/domain/`** — pure, framework-free business logic, and the most heavily tested part of the codebase. No longer wired into the render path (see "Architecture" below) — it's what the mock server calls instead.
  - `operators.ts` — the property-type → valid-operators validity matrix from the README.
  - `filter.ts` — `evaluateCondition` (does one product match one condition?), `filterProducts`, and `isConditionComplete`.
- **`src/mocks/`** — the reimplemented dataset and its MSW GraphQL handlers.
  - `data.ts` — the same products/properties/operators as `datastore.js`, camelCased for GraphQL, including products 3-5 deliberately omitting their `wireless` value.
  - `handlers.ts` — two MSW handlers: `graphql.query('ReferenceData', ...)` resolves with properties + operators; `graphql.query('Products', ...)` reads the `condition` variable and resolves with `filterProducts(allProducts, condition, properties)` — this is where filtering actually happens now.
  - `browser.ts` / `server.ts` — the MSW worker (used in dev, wired up in `main.tsx`) and MSW server (used in tests, wired up in `setupTests.ts`), sharing the same `handlers`.
- **`src/components/`** — `ConditionEditor` (property/operator/value selection), `ValueInput` (renders the right input for the selected property type + operator), `ProductList` (the live-updating table, now just rendering whatever `useProducts` holds).
- **`src/App.tsx`** — fetches reference data once, holds the current `Condition` in state, and passes it straight to `useProducts`. No client-side filtering call in the render path — `App` renders whatever `useProducts` returns.

## Architecture / stack choices

- **Vite + React + TypeScript**: as specified. `npm create vite@latest -- --template react-ts` scaffold, since the exercise didn't ask for a hand-rolled build.
- **`graphql-request` over `urql`**: two small queries, no caching strategy beyond "refetch `products` when its variable changes", and no mutations — `urql`'s normalized cache and exchange pipeline would be pure overhead here. `graphql-request` is a thin `fetch` wrapper, so the "client-side machinery" the exercise asks for is a couple of small hooks (`useReferenceData`, `useProducts`) rather than a library's internals, which felt like the more honest demonstration of the plumbing for a dataset this size.
- **MSW (`msw/browser` in dev, `msw/node` in tests) sharing one `handlers.ts`**: the same mocked GraphQL API backs both the running app and the test suite, so a component test failure means the *real* UI code has a bug, not that a hand-rolled test double drifted from what the app actually calls.
- **No real GraphQL schema/executor**: `handlers.ts` matches requests by operation name (`graphql.query('ReferenceData', ...)`, `graphql.query('Products', ...)`) and returns a plain JS object shaped like the query — there's no `graphql-js` schema validating it against SDL, so `ConditionInput` is a TypeScript type on the client/handler side rather than a validated GraphQL input type. For a mocked, read-only API this is the standard MSW pattern and kept the surface area proportional to the exercise; a real backend would obviously need an actual executable schema (SDL for `ConditionInput`, a real resolver for `products(condition:)`, etc.).
- **Filtering happens on the server (the mocked GraphQL API), not the client.** Properties and operators are static reference data for the session and are still fetched once via `ReferenceData`. Products are fetched via a separate `products(condition: ConditionInput)` query: `ConditionEditor` edits a `Condition` value in React state, `useProducts` sends it as the `condition` variable, and MSW's `Products` handler (`src/mocks/handlers.ts`) applies `filterProducts`/`evaluateCondition` — the same domain logic as before — to decide what comes back. `App` and `ProductList` just render whatever that query currently holds; there's no `filterProducts` call left in the render path. `useProducts` only sends `condition` once it's actually complete (`isConditionComplete`) — a property-only or value-less condition would filter identically to "no condition" server-side, so the client asks for the unfiltered list instead of round-tripping a condition the server would treat the same way — and refetches whenever that *effective* condition changes (derived to a stable key so building an incomplete condition doesn't cause redundant requests). This means changing the filter is now a real request/response cycle against the mocked network layer, which is also how it's tested (see "Testing" below) — a component test that broke the `Products` handler, rather than a `filterProducts` unit test, is what would catch a regression in "does changing the condition actually change what's on screen".
- **Why split into two queries instead of one parameterized `Catalog` query**: properties/operators and products have different lifetimes — the former never change once loaded, the latter change on every condition edit. Splitting them means editing a condition only ever triggers the cheaper, product-only round trip, and reference data doesn't get needlessly re-sent (or re-diffed) on every keystroke.
- **Data-driven UI**: the property dropdown, operator options (filtered per type via `getValidOperatorIds`), and the `ProductList` table's columns are all built from whatever `properties`/`operators`/`products` come back from the query — nothing hardcodes "5 properties" or specific property names/ids. Swap the mock dataset for a different customer's data and the UI adapts without code changes.

## Testing

- **`domain/filter.test.ts`** — `evaluateCondition` and `filterProducts` against:
  - Each README worked example (`equals`, `greater_than`/`less_than`, `any`/`none`, `in`, `contains`), run against the real mock dataset.
  - The `contains` example specifically, including product names the mock dataset doesn't contain (`Telephone`, `Phone`) via a small synthetic fixture, so the exact README wording is covered even where the shipped dataset only has two of the four example matches.
  - `any`/`none` against products 3-5, which is the dataset's designed test case for a missing property value.
  - A synthetic-fixture pass over the *entire* property-type × operator matrix (string/number/enumerated × all 7 operators, restricted to what's valid for each), independent of the specific mock dataset.

  These stayed as direct, pure unit tests of the domain module rather than moving behind the network layer: they're exercising the matching semantics themselves — the same code the `Products` MSW handler calls — and pinning that down at the unit level (property-type/operator validity matrix, worked examples) is more precise and faster than driving every combination through a rendered component and a mocked request.
- **`domain/operators.test.ts`** — asserts the validity matrix itself: exactly which operators are valid for each of the three property types, including the negative cases (`contains` invalid for number/enumerated, `greater_than`/`less_than` invalid for string/enumerated).
- **`App.test.tsx`** — component/integration tests rendering the real `App`, going through the real `useReferenceData`/`useProducts` hooks and the real MSW `ReferenceData`/`Products` handlers — nothing about filtering is stubbed at the React level. Because filtering is now a network round trip, assertions that depend on a filtered result `await` it (`waitFor`) rather than reading the DOM synchronously right after an interaction; this is deliberate, not incidental — it's what proves the UI is actually waiting on the `Products` response instead of computing the list itself. Covers: initial full list, live filtering as property/operator/value change (numeric, string `contains`, enumerated `any`/`none`, enumerated `in` via checkboxes), operator options narrowing per property type, clear-filter restoring the full list, and a request/response test that spies on the `Products` handler's `variables` directly to assert the client omits `condition` while a condition is incomplete and sends the exact `{propertyId, operatorId, value}` shape once it's complete.

Run `npm run test` for the full suite.

## Assumptions and deviations worth a second look

- **`contains` is case-insensitive**; `equals` and `in` are exact/case-sensitive matches. The README doesn't state case sensitivity explicitly; case-insensitive substring search felt like the more useful default for a "contains" search box, while `equals`/`in` staying exact preserves "exactly matches" as written.
- **`in`'s value input is a comma-separated text field** for string/number properties (matching the README's `Headphones, Keys` example verbatim) and a checkbox group for enumerated properties (so users pick from the actual allowed values rather than typing them).
- **The GraphQL endpoint (`http://localhost/graphql`) is a placeholder**, not a real reachable host — MSW intercepts by operation name regardless of the request URL, and Node's global `fetch` (which is what runs under Vitest even with `environment: "jsdom"`) rejects a bare relative path like `/graphql` with "Invalid URL". Pointing this at a real backend would just mean making the endpoint configurable (e.g. via an env var) and dropping the MSW `worker.start()` call in `main.tsx`.
- **No routing, no persistence** of the condition across reloads — out of scope per the spec ("a single filter").
- **Numbers compare numerically even if a raw value arrives as a string** (`toNumber` coerces); this only matters if a future dataset stores numeric properties as strings, but it's cheap defensiveness given the mocked layer already treats `value` as `string | number`.

## Time spent

Roughly 2-3 hours: reading the spec and datastore closely, scaffolding, building the GraphQL/MSW plumbing, the domain logic and its tests, the UI, and the component tests.
