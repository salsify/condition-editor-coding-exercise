import { describe, expect, it } from "vitest";
import type { Product, Property } from "../api/types";
import { evaluateCondition, filterProducts } from "./filter";
import { mockCatalog } from "../mocks/data";

const { properties, products } = mockCatalog;

const propertyName = properties.find((p) => p.id === 0)!; // string
const propertyColor = properties.find((p) => p.id === 1)!; // string
const propertyWeight = properties.find((p) => p.id === 2)!; // number
const propertyCategory = properties.find((p) => p.id === 3)!; // enumerated
const propertyWireless = properties.find((p) => p.id === 4)!; // enumerated, sparse

function nameOf(product: Product): string {
  return String(
    product.propertyValues.find((pv) => pv.propertyId === 0)!.value,
  );
}

describe("evaluateCondition", () => {
  describe("equals", () => {
    it("matches a string property exactly (README example: Name equals Headphones)", () => {
      const headphones = products.find((p) => nameOf(p) === "Headphones")!;
      const keyboard = products.find((p) => nameOf(p) === "Keyboard")!;
      const condition = {
        propertyId: 0,
        operatorId: "equals" as const,
        value: "Headphones",
      };
      expect(evaluateCondition(headphones, condition, propertyName)).toBe(true);
      expect(evaluateCondition(keyboard, condition, propertyName)).toBe(false);
    });

    it("matches a number property numerically, not by string identity", () => {
      const weighs5 = products.find((p) => nameOf(p) === "Headphones")!;
      const condition = {
        propertyId: 2,
        operatorId: "equals" as const,
        value: 5,
      };
      expect(evaluateCondition(weighs5, condition, propertyWeight)).toBe(true);
    });

    it("matches an enumerated property", () => {
      const cup = products.find((p) => nameOf(p) === "Cup")!;
      const condition = {
        propertyId: 3,
        operatorId: "equals" as const,
        value: "kitchenware",
      };
      expect(evaluateCondition(cup, condition, propertyCategory)).toBe(true);
    });

    it("does not match when the property is missing on the product", () => {
      const cup = products.find((p) => nameOf(p) === "Cup")!; // no wireless value
      const condition = {
        propertyId: 4,
        operatorId: "equals" as const,
        value: "true",
      };
      expect(evaluateCondition(cup, condition, propertyWireless)).toBe(false);
    });
  });

  describe("greater_than / less_than (README example: Price/weight)", () => {
    it("greater_than matches products whose numeric value is strictly greater", () => {
      const condition = {
        propertyId: 2,
        operatorId: "greater_than" as const,
        value: 4,
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyWeight))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Hammer", "Headphones", "Keyboard"]);
    });

    it("less_than matches products whose numeric value is strictly less", () => {
      const condition = {
        propertyId: 2,
        operatorId: "less_than" as const,
        value: 4,
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyWeight))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cell Phone", "Cup", "Key"]);
    });
  });

  describe("any / none (README example: Description any/none)", () => {
    it("any matches only products that have the property at all", () => {
      const condition = { propertyId: 4, operatorId: "any" as const };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyWireless))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cell Phone", "Headphones", "Keyboard"]);
    });

    it("none matches only products missing the property entirely", () => {
      const condition = { propertyId: 4, operatorId: "none" as const };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyWireless))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cup", "Hammer", "Key"]);
    });

    it("any/none work the same way for properties every product has", () => {
      const anyCondition = { propertyId: 0, operatorId: "any" as const };
      const noneCondition = { propertyId: 0, operatorId: "none" as const };
      for (const product of products) {
        expect(evaluateCondition(product, anyCondition, propertyName)).toBe(
          true,
        );
        expect(evaluateCondition(product, noneCondition, propertyName)).toBe(
          false,
        );
      }
    });
  });

  describe("in (README example: Name is any of Headphones, Keys)", () => {
    it("matches a string property against a list of exact values", () => {
      const condition = {
        propertyId: 0,
        operatorId: "in" as const,
        value: ["Headphones", "Key"],
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyName))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Headphones", "Key"]);
    });

    it("matches a number property against a list of numeric values", () => {
      const condition = {
        propertyId: 2,
        operatorId: "in" as const,
        value: [1, 19],
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyWeight))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Hammer", "Key"]);
    });

    it("matches an enumerated property against a list of values", () => {
      const condition = {
        propertyId: 3,
        operatorId: "in" as const,
        value: ["tools", "kitchenware"],
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyCategory))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cup", "Hammer", "Key"]);
    });

    it("matches nothing when the value list is empty", () => {
      const condition = { propertyId: 0, operatorId: "in" as const, value: [] };
      const matches = products.filter((p) =>
        evaluateCondition(p, condition, propertyName),
      );
      expect(matches).toHaveLength(0);
    });
  });

  describe("contains (README worked example)", () => {
    // The README's own example ("Headphones, Telephone, Cell Phone, Phone")
    // includes products not present in this dataset, so it's verified
    // against a small synthetic fixture in addition to the real dataset.
    const syntheticProducts: Product[] = [
      { id: 100, propertyValues: [{ propertyId: 0, value: "Headphones" }] },
      { id: 101, propertyValues: [{ propertyId: 0, value: "Telephone" }] },
      { id: 102, propertyValues: [{ propertyId: 0, value: "Cell Phone" }] },
      { id: 103, propertyValues: [{ propertyId: 0, value: "Phone" }] },
      { id: 104, propertyValues: [{ propertyId: 0, value: "Keyboard" }] },
    ];

    it("matches every product whose name contains the substring", () => {
      const condition = {
        propertyId: 0,
        operatorId: "contains" as const,
        value: "phone",
      };
      const matches = syntheticProducts
        .filter((p) => evaluateCondition(p, condition, propertyName))
        .map(nameOf);
      expect(matches.sort()).toEqual([
        "Cell Phone",
        "Headphones",
        "Phone",
        "Telephone",
      ]);
    });

    it("is case-insensitive", () => {
      const condition = {
        propertyId: 0,
        operatorId: "contains" as const,
        value: "PHONE",
      };
      expect(
        evaluateCondition(syntheticProducts[0], condition, propertyName),
      ).toBe(true);
    });

    it("applies against the real dataset too", () => {
      const condition = {
        propertyId: 0,
        operatorId: "contains" as const,
        value: "phone",
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyName))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cell Phone", "Headphones"]);
    });

    it("also works on non-Name string properties (color)", () => {
      const condition = {
        propertyId: 1,
        operatorId: "contains" as const,
        value: "lac",
      };
      const matches = products
        .filter((p) => evaluateCondition(p, condition, propertyColor))
        .map(nameOf);
      expect(matches.sort()).toEqual(["Cell Phone", "Headphones"]);
    });
  });
});

describe("filterProducts", () => {
  it("returns every product when there is no condition (clear filter)", () => {
    expect(filterProducts(products, null, properties)).toEqual(products);
    expect(filterProducts(products, undefined, properties)).toEqual(products);
  });

  it("returns every product when the condition's property can't be resolved", () => {
    const condition = {
      propertyId: 999,
      operatorId: "any" as const,
    };
    expect(filterProducts(products, condition, properties)).toEqual(products);
  });

  it("filters down to matching products for a real condition", () => {
    const condition = {
      propertyId: 3,
      operatorId: "equals" as const,
      value: "electronics",
    };
    const result = filterProducts(products, condition, properties);
    expect(result.map(nameOf).sort()).toEqual([
      "Cell Phone",
      "Headphones",
      "Keyboard",
    ]);
  });
});

describe("full property type x operator validity matrix (behavioral)", () => {
  // These fixtures exist purely to exercise the exhaustive matrix from the
  // README, independent of the `mockCatalog` data used above.
  const stringProperty: Property = { id: 10, name: "Label", type: "string" };
  const numberProperty: Property = { id: 11, name: "Count", type: "number" };
  const enumProperty: Property = {
    id: 12,
    name: "Status",
    type: "enumerated",
    values: ["open", "closed"],
  };

  const withValue = (propertyId: number, value: string | number): Product => ({
    id: 1,
    propertyValues: [{ propertyId, value }],
  });
  const withoutValue = (): Product => ({ id: 2, propertyValues: [] });

  it("string: equals, contains, in, any, none all behave correctly", () => {
    const present = withValue(10, "hello world");
    const absent = withoutValue();

    expect(
      evaluateCondition(
        present,
        { propertyId: 10, operatorId: "equals", value: "hello world" },
        stringProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 10, operatorId: "contains", value: "world" },
        stringProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 10, operatorId: "in", value: ["nope", "hello world"] },
        stringProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 10, operatorId: "any" },
        stringProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        absent,
        { propertyId: 10, operatorId: "none" },
        stringProperty,
      ),
    ).toBe(true);
  });

  it("number: equals, greater_than, less_than, in, any, none all behave correctly", () => {
    const present = withValue(11, 10);
    const absent = withoutValue();

    expect(
      evaluateCondition(
        present,
        { propertyId: 11, operatorId: "equals", value: 10 },
        numberProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 11, operatorId: "greater_than", value: 5 },
        numberProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 11, operatorId: "less_than", value: 20 },
        numberProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 11, operatorId: "in", value: [1, 10] },
        numberProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 11, operatorId: "any" },
        numberProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        absent,
        { propertyId: 11, operatorId: "none" },
        numberProperty,
      ),
    ).toBe(true);
  });

  it("enumerated: equals, in, any, none all behave correctly (no contains/greater/less)", () => {
    const present = withValue(12, "open");
    const absent = withoutValue();

    expect(
      evaluateCondition(
        present,
        { propertyId: 12, operatorId: "equals", value: "open" },
        enumProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 12, operatorId: "in", value: ["closed", "open"] },
        enumProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        present,
        { propertyId: 12, operatorId: "any" },
        enumProperty,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        absent,
        { propertyId: 12, operatorId: "none" },
        enumProperty,
      ),
    ).toBe(true);
  });
});
