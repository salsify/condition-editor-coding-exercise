# Product Filtering Condition Editor

This is a live pairing exercise built around a working product-filtering app: a small React/TypeScript app that lets a user filter a product catalog, backed by a mocked GraphQL API.

## How this codebase works

### What it does

The app renders a product catalog table alongside a condition editor: pick a property (e.g. `weight`, `color`), pick an operator valid for that property's type (e.g. `greater_than`, `contains`, `any`), and, if the operator needs one, a value. As soon as the condition is complete, the product list updates to show only the matching products. Properties, operators, and products all come from a mocked GraphQL API (via [MSW](https://mswjs.io/)) rather than being hardcoded, so the UI is data-driven: it doesn't assume a fixed set of properties or property types.

### Running it

```sh
npm install
npm run dev         # http://localhost:5173, MSW mocks the GraphQL API in the browser
npm run test        # Vitest + React Testing Library, MSW-mocked
npm run test:watch  # same, in watch mode
npm run typecheck   # tsc -b, no emit
npm run lint        # oxlint
npm run build       # tsc -b && vite build, production bundle in dist/
```

### High-level structure

- **`src/App.tsx`**: top-level component. Fetches reference data once on mount, holds the current condition in React state, and renders whatever the products query currently returns. It doesn't filter anything itself.
- **`src/api/`**: the GraphQL client layer: types (`types.ts`), the two queries the app makes, `ReferenceData` and `Products($condition)` (`queries.ts`), a thin `graphql-request` client (`client.ts`), and the hooks that call them (`useReferenceData.ts`, `useProducts.ts`).
- **`src/domain/`**: pure, framework-free filtering logic (`filter.ts`, `operators.ts`): given a condition and a product, does it match? What operators are valid for a given property type? No React, no network, just functions and their unit tests.
- **`src/mocks/`**: the mocked backend. `data.ts` holds the reimplemented dataset; `handlers.ts` defines the MSW GraphQL handlers that resolve `ReferenceData` and `Products`, and this is where `src/domain`'s filtering logic actually gets called today. `browser.ts` / `server.ts` wire the same handlers into the dev server and the test suite, respectively.
- **`src/components/`**: `ConditionEditor` (property/operator/value selection), `ValueInput` (the right input widget for a given property type and operator), `ProductList` (renders the current product list).

This is a boundary worth understanding before making changes: filtering doesn't happen in the browser, it happens in the mocked GraphQL server (`src/mocks/handlers.ts`), which calls into `src/domain`. The client just sends a condition and renders whatever comes back.

### Data flow through a typical request

When a user finishes building a condition in `ConditionEditor`, `App` updates its `condition` state, which `useProducts` picks up and sends as the `condition` variable on a `Products` GraphQL request. MSW intercepts that request by operation name in `src/mocks/handlers.ts`, which calls `filterProducts` against the mock dataset and the given condition, and returns the matching products as the mocked response. `useProducts` exposes that result, and `App` passes it to `ProductList`, which renders the updated table.

### Tests

Colocated next to the code they cover:
- `src/domain/filter.test.ts` and `operators.test.ts`: unit tests of the pure filtering/validity logic.
- `src/App.test.tsx`: integration tests rendering the real `App` through the real hooks and real MSW handlers, asserting on rendered output and on the requests MSW actually receives.

## Your task

Users have told us that filtering by a single condition isn't enough for real-world catalogs. Your task in this session is to address that gap in this codebase. How you approach it, what changes, how much, and where, is up to you; we're interested in how you think through it, not in matching a particular answer.

## Using AI

You're encouraged to use AI assistance during this exercise. Just make sure your screen is shared for the full session, including any prompts you type into an AI tool, so we can follow your thinking as you go.
