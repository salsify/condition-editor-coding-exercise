import { useMemo, useState } from "react";
import { useCatalog } from "./api/useCatalog";
import { ConditionEditor } from "./components/ConditionEditor";
import { ProductList } from "./components/ProductList";
import type { Operator, Product, Property } from "./api/types";
import { filterProducts, type Condition } from "./domain/filter";
import "./App.css";

// Stable empty-array fallbacks (rather than `[]` literals) so `useMemo`
// below doesn't see a "new" dependency on every render while loading/erroring.
const NO_PROPERTIES: Property[] = [];
const NO_OPERATORS: Operator[] = [];
const NO_PRODUCTS: Product[] = [];

function App() {
  const catalog = useCatalog();
  const [condition, setCondition] = useState<Condition | null>(null);

  const properties =
    catalog.status === "success" ? catalog.data.properties : NO_PROPERTIES;
  const operators =
    catalog.status === "success" ? catalog.data.operators : NO_OPERATORS;
  const products =
    catalog.status === "success" ? catalog.data.products : NO_PRODUCTS;

  // Always call useMemo (even before we know the catalog loaded) so hook
  // order stays stable across the loading -> success/error transition.
  const filteredProducts = useMemo(
    () => filterProducts(products, condition, properties),
    [products, condition, properties],
  );

  if (catalog.status === "loading") {
    return (
      <main className="app">
        <p role="status">Loading catalog…</p>
      </main>
    );
  }

  if (catalog.status === "error") {
    return (
      <main className="app">
        <p role="alert">Failed to load catalog: {catalog.error.message}</p>
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
      <ProductList products={filteredProducts} properties={properties} />
    </main>
  );
}

export default App;
