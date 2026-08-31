import { useState } from "react";
import { useReferenceData } from "./api/useReferenceData";
import { useProducts } from "./api/useProducts";
import { ConditionEditor } from "./components/ConditionEditor";
import { ProductList } from "./components/ProductList";
import type { Operator, Property } from "./api/types";
import type { Condition } from "./domain/filter";
import "./App.css";

// Stable empty-array fallbacks (rather than `[]` literals) so components
// below don't see "new" props on every render while loading/erroring.
const NO_PROPERTIES: Property[] = [];
const NO_OPERATORS: Operator[] = [];

function App() {
  const referenceData = useReferenceData();
  const [condition, setCondition] = useState<Condition | null>(null);

  // The server does the filtering (see `src/mocks/handlers.ts`) — this
  // just renders whatever the `products` query currently holds for
  // `condition`. `useProducts` keeps the previous list visible while a
  // refetch is in flight, so there's no need to gate rendering on its
  // status the way `referenceData`'s one-time load is gated below.
  const productsState = useProducts(condition);

  const properties =
    referenceData.status === "success" ? referenceData.data.properties : NO_PROPERTIES;
  const operators =
    referenceData.status === "success" ? referenceData.data.operators : NO_OPERATORS;

  if (referenceData.status === "loading") {
    return (
      <main className="app">
        <p role="status">Loading catalog…</p>
      </main>
    );
  }

  if (referenceData.status === "error") {
    return (
      <main className="app">
        <p role="alert">
          Failed to load catalog: {referenceData.error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Product Filter</h1>
      <ConditionEditor
        properties={properties}
        operators={operators}
        condition={condition}
        onConditionChange={setCondition}
        onClear={() => setCondition(null)}
      />
      {productsState.status === "error" ? (
        <p role="alert">
          Failed to load products: {productsState.error.message}
        </p>
      ) : (
        <ProductList products={productsState.products} properties={properties} />
      )}
    </main>
  );
}

export default App;
