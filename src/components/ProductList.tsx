import type { Product, Property } from "../api/types";

interface ProductListProps {
  products: Product[];
  properties: Property[];
}

/**
 * Renders the (already-filtered) product list as a table with one column
 * per property, driven entirely by whatever properties were fetched — no
 * column is hardcoded to a specific property name.
 */
export function ProductList({ products, properties }: ProductListProps) {
  const orderedProperties = [...properties].sort((a, b) => a.id - b.id);

  return (
    <div className="product-list">
      <p className="product-list__count">
        {products.length} product{products.length === 1 ? "" : "s"}
      </p>
      <div className="product-list__table-wrap">
        <table>
          <thead>
            <tr>
              {orderedProperties.map((property) => (
                <th key={property.id}>{property.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {orderedProperties.map((property) => {
                  const propertyValue = product.propertyValues.find(
                    (pv) => pv.propertyId === property.id,
                  );
                  return (
                    <td key={property.id}>
                      {propertyValue ? String(propertyValue.value) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
