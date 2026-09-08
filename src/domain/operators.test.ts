import { describe, expect, it } from "vitest";
import {
  getValidOperatorIds,
  isOperatorValidForType,
  operatorTakesMultipleValues,
  operatorTakesValue,
} from "./operators";
import type { OperatorId } from "../api/types";

const ALL_OPERATORS: OperatorId[] = [
  "equals",
  "greater_than",
  "less_than",
  "any",
  "none",
  "in",
  "contains",
];

describe("getValidOperatorIds", () => {
  it("string: equals, contains, any, none, in — no greater_than/less_than", () => {
    expect(new Set(getValidOperatorIds("string"))).toEqual(
      new Set(["equals", "contains", "any", "none", "in"]),
    );
  });

  it("number: equals, greater_than, less_than, any, none, in — no contains", () => {
    expect(new Set(getValidOperatorIds("number"))).toEqual(
      new Set(["equals", "greater_than", "less_than", "any", "none", "in"]),
    );
  });

  it("enumerated: equals, any, none, in — no contains/greater_than/less_than", () => {
    expect(new Set(getValidOperatorIds("enumerated"))).toEqual(
      new Set(["equals", "any", "none", "in"]),
    );
  });
});

describe("isOperatorValidForType — full matrix", () => {
  const expected: Record<OperatorId, Record<"string" | "number" | "enumerated", boolean>> = {
    equals: { string: true, number: true, enumerated: true },
    greater_than: { string: false, number: true, enumerated: false },
    less_than: { string: false, number: true, enumerated: false },
    any: { string: true, number: true, enumerated: true },
    none: { string: true, number: true, enumerated: true },
    in: { string: true, number: true, enumerated: true },
    contains: { string: true, number: false, enumerated: false },
  };

  for (const operatorId of ALL_OPERATORS) {
    for (const type of ["string", "number", "enumerated"] as const) {
      it(`${operatorId} x ${type} => ${expected[operatorId][type]}`, () => {
        expect(isOperatorValidForType(operatorId, type)).toBe(
          expected[operatorId][type],
        );
      });
    }
  }
});

describe("operatorTakesValue", () => {
  it("any and none take no value", () => {
    expect(operatorTakesValue("any")).toBe(false);
    expect(operatorTakesValue("none")).toBe(false);
  });

  it("every other operator takes a value", () => {
    for (const operatorId of ALL_OPERATORS) {
      if (operatorId === "any" || operatorId === "none") continue;
      expect(operatorTakesValue(operatorId)).toBe(true);
    }
  });
});

describe("operatorTakesMultipleValues", () => {
  it("only 'in' takes multiple values", () => {
    for (const operatorId of ALL_OPERATORS) {
      expect(operatorTakesMultipleValues(operatorId)).toBe(
        operatorId === "in",
      );
    }
  });
});
