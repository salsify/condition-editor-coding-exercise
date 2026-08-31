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
  - `types.ts` — TypeScript types for `Property`, `Product`, `Operator`, etc., describing what the mocked API returns.
  - `queries.ts` — the single `Catalog` query (properties + operators + products).
  - `client.ts` — a `graphql-request` `GraphQLClient` pointed at a (placeholder) GraphQL endpoint.
  - `useCatalog.ts` — a small hook that fetches the catalog once on mount and exposes `{status: 'loading'|'error'|'success', ...}`.
- **`src/domain/`** — pure, framework-free business logic, and the most heavily tested part of the codebase.
  - `operators.ts` — the property-type → valid-operators validity matrix from the README.
  - `filter.ts` — `evaluateCondition` (does one product match one condition?) and `filterProducts`.
- **`src/mocks/`** — the reimplemented dataset and its MSW GraphQL handlers.
  - `data.ts` — the same products/properties/operators as `datastore.js`, camelCased for GraphQL, including products 3-5 deliberately omitting their `wireless` value.
  - `handlers.ts` — an MSW `graphql.query('Catalog', ...)` handler resolving with that data.
  - `browser.ts` / `server.ts` — the MSW worker (used in dev, wired up in `main.tsx`) and MSW server (used in tests, wired up in `setupTests.ts`), sharing the same `handlers`.
- **`src/components/`** — `ConditionEditor` (property/operator/value selection), `ValueInput` (renders the right input for the selected property type + operator), `ProductList` (the live-updating table).
- **`src/App.tsx`** — fetches the catalog, holds the current `Condition`, and derives the filtered product list with `useMemo`.

## Architecture / stack choices

- **Vite + React + TypeScript**: as specified. `npm create vite@latest -- --template react-ts` scaffold, since the exercise didn't ask for a hand-rolled build.
- **`graphql-request` over `urql`**: the app makes exactly one query, once, with no variables, no caching strategy, and no mutations — `urql`'s normalized cache and exchange pipeline would be pure overhead here. `graphql-request` is a thin `fetch` wrapper, so the "client-side machinery" the exercise asks for is a ~15-line `useCatalog` hook rather than a library's internals, which felt like the more honest demonstration of the plumbing for a dataset this size.
- **MSW (`msw/browser` in dev, `msw/node` in tests) sharing one `handlers.ts`**: the same mocked GraphQL API backs both the running app and the test suite, so a component test failure means the *real* UI code has a bug, not that a hand-rolled test double drifted from what the app actually calls.
- **No real GraphQL schema/executor**: `handlers.ts` matches requests by operation name (`graphql.query('Catalog', ...)`) and returns a plain JS object shaped like the query — there's no `graphql-js` schema validating it against SDL. For a mocked, read-only, single-query API this is the standard MSW pattern and kept the surface area proportional to the exercise; a real backend would obviously need an actual executable schema.
- **Filtering is client-side**, not a new GraphQL request per keystroke: the catalog (properties, operators, and all products) is fetched once; `ConditionEditor` edits a `Condition` value in React state, and `filterProducts` (pure, synchronous) recomputes the visible list via `useMemo`. This mirrors the original vanilla-JS exercise, where `datastore.js` was also just an in-memory dataset filtered in the browser — swapping it for a mocked GraphQL layer changes *how the data arrives*, not the fact that filtering is a client-side computation over an already-fetched list.
- **Data-driven UI**: the property dropdown, operator options (filtered per type via `getValidOperatorIds`), and the `ProductList` table's columns are all built from whatever `properties`/`operators`/`products` come back from the query — nothing hardcodes "5 properties" or specific property names/ids. Swap the mock dataset for a different customer's data and the UI adapts without code changes.

## Testing

- **`domain/filter.test.ts`** (32 tests) — `evaluateCondition` and `filterProducts` against:
  - Each README worked example (`equals`, `greater_than`/`less_than`, `any`/`none`, `in`, `contains`), run against the real mock dataset.
  - The `contains` example specifically, including product names the mock dataset doesn't contain (`Telephone`, `Phone`) via a small synthetic fixture, so the exact README wording is covered even where the shipped dataset only has two of the four example matches.
  - `any`/`none` against products 3-5, which is the dataset's designed test case for a missing property value.
  - A synthetic-fixture pass over the *entire* property-type × operator matrix (string/number/enumerated × all 7 operators, restricted to what's valid for each), independent of the specific mock dataset.
- **`domain/operators.test.ts`** (18 tests) — asserts the validity matrix itself: exactly which operators are valid for each of the three property types, including the negative cases (`contains` invalid for number/enumerated, `greater_than`/`less_than` invalid for string/enumerated).
- **`App.test.tsx`** (7 tests) — component/integration tests rendering the real `App` against the MSW-mocked GraphQL response: initial full list, live filtering as property/operator/value change (numeric, string `contains`, enumerated `any`/`none`, enumerated `in` via checkboxes), operator options narrowing per property type, and clear-filter restoring the full list.

Run `npm run test` for all 57.

## Assumptions and deviations worth a second look

- **`contains` is case-insensitive**; `equals` and `in` are exact/case-sensitive matches. The README doesn't state case sensitivity explicitly; case-insensitive substring search felt like the more useful default for a "contains" search box, while `equals`/`in` staying exact preserves "exactly matches" as written.
- **`in`'s value input is a comma-separated text field** for string/number properties (matching the README's `Headphones, Keys` example verbatim) and a checkbox group for enumerated properties (so users pick from the actual allowed values rather than typing them).
- **The GraphQL endpoint (`http://localhost/graphql`) is a placeholder**, not a real reachable host — MSW intercepts by operation name regardless of the request URL, and Node's global `fetch` (which is what runs under Vitest even with `environment: "jsdom"`) rejects a bare relative path like `/graphql` with "Invalid URL". Pointing this at a real backend would just mean making the endpoint configurable (e.g. via an env var) and dropping the MSW `worker.start()` call in `main.tsx`.
- **No routing, no persistence** of the condition across reloads — out of scope per the spec ("a single filter").
- **Numbers compare numerically even if a raw value arrives as a string** (`toNumber` coerces); this only matters if a future dataset stores numeric properties as strings, but it's cheap defensiveness given the mocked layer already treats `value` as `string | number`.

## Time spent

Roughly 2-3 hours: reading the spec and datastore closely, scaffolding, building the GraphQL/MSW plumbing, the domain logic and its tests, the UI, and the component tests.
