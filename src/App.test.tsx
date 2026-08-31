import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App";
import type { ConditionInput } from "./api/types";
import { server } from "./mocks/server";

/**
 * These are component/integration tests: `App` renders for real, and MSW
 * (wired up globally in `setupTests.ts`) intercepts its `ReferenceData` and
 * `Products` GraphQL requests — nothing about the datastore or the
 * filtering logic is stubbed at the React level. Filtering now happens in
 * the `Products` MSW handler (see `src/mocks/handlers.ts`), not in `App`,
 * so every assertion below that depends on a filtered result is exercising
 * a real request/response cycle: changing the condition triggers a new
 * `Products` request, and what lands on screen is whatever that mocked
 * response contains — not a client-side computation over an already-fetched
 * list. Because that's a real (if fast) async round trip, those assertions
 * `await` via `waitFor` rather than reading the DOM synchronously right
 * after an interaction.
 */

const FULL_LIST = [
  "Cell Phone",
  "Cup",
  "Hammer",
  "Headphones",
  "Key",
  "Keyboard",
];

function getProductNames(): string[] {
  const table = screen.getByRole("table");
  const rows = within(table).getAllByRole("row").slice(1); // skip header row
  return rows.map((row) => within(row).getAllByRole("cell")[0].textContent!);
}

async function expectProductNames(expected: string[]) {
  const wanted = [...expected].sort();
  await waitFor(() => {
    expect(getProductNames().sort()).toEqual(wanted);
  });
}

async function waitForCatalog() {
  await screen.findByRole("combobox", { name: "Property" });
  // The initial (unfiltered) `products` request is separate from
  // `ReferenceData` and resolves asynchronously too — wait for it so
  // subsequent assertions aren't racing against an empty/loading table.
  await expectProductNames(FULL_LIST);
}

describe("App", () => {
  it("shows every product before any filter is applied", async () => {
    render(<App />);
    await waitForCatalog();
  });

  it("does not filter until the condition is fully set (property only)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "weight (oz)",
    );

    // Property selected, but no operator chosen by the user yet (the
    // default operator is pre-filled with no value) — the condition isn't
    // complete, so the client doesn't even send it; full list still.
    await expectProductNames(FULL_LIST);
  });

  it("does not filter until a value-requiring operator's value is entered", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "weight (oz)",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is greater than",
    );

    // Operator needs a value ("Is greater than") but none has been typed
    // yet — still the full list, not an empty (or wrongly filtered) one.
    await expectProductNames(FULL_LIST);
  });

  it("filters live as a numeric condition is built (weight > 4)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "weight (oz)",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is greater than",
    );
    await user.type(screen.getByRole("spinbutton", { name: "Value" }), "4");

    await expectProductNames(["Hammer", "Headphones", "Keyboard"]);
  });

  it("filters using contains, matching the README worked example", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "Product Name",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Contains",
    );
    await user.type(screen.getByRole("textbox", { name: "Value" }), "phone");

    await expectProductNames(["Cell Phone", "Headphones"]);
  });

  it("has no value input for 'Has any value' / 'Has no value', and filters correctly", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "wireless",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Has any value",
    );

    expect(screen.queryByLabelText("Value")).not.toBeInTheDocument();
    // The "Value" field label itself must also be gone — not just its
    // input — so there's no orphaned "Value" text left dangling above a
    // hidden input.
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    await expectProductNames(["Cell Phone", "Headphones", "Keyboard"]);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Has no value",
    );
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    await expectProductNames(["Cup", "Hammer", "Key"]);
  });

  it("filters an enumerated property with 'Is any of' via a checkbox group", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "category",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is any of",
    );

    const group = screen.getByRole("group", { name: "Value" });
    await user.click(within(group).getByLabelText("tools"));
    await user.click(within(group).getByLabelText("kitchenware"));

    await expectProductNames(["Cup", "Hammer", "Key"]);
  });

  it("only offers operators valid for the selected property's type", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "category",
    );
    const operatorSelect = screen.getByRole("combobox", { name: "Operator" });
    const optionLabels = within(operatorSelect)
      .getAllByRole("option")
      .map((o) => o.textContent);

    expect(optionLabels).toEqual([
      "Equals",
      "Has any value",
      "Has no value",
      "Is any of",
    ]);
  });

  it("clearing the filter restores the full product list", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "Product Name",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Equals",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Value" }),
      "Headphones",
    );
    await expectProductNames(["Headphones"]);

    await user.click(screen.getByRole("button", { name: "Clear filter" }));

    await expectProductNames(FULL_LIST);
    expect(
      screen.queryByRole("combobox", { name: "Operator" }),
    ).not.toBeInTheDocument();
  });

  it("allows typing a comma-separated list into a string 'Is any of' value, including mid-typing commas", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "Product Name",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is any of",
    );

    const valueInput = screen.getByRole("textbox", { name: "Value" });
    await user.type(valueInput, "Headphones,");

    // The trailing comma the user just typed must still be visible — it
    // must not be silently stripped mid-typing, which is what made typing
    // a second value look impossible.
    expect(valueInput).toHaveValue("Headphones,");

    await user.type(valueInput, " Key");
    expect(valueInput).toHaveValue("Headphones, Key");

    await expectProductNames(["Headphones", "Key"]);
  });

  it("allows typing a comma-separated list into a number 'Is any of' value, including mid-typing commas", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "weight (oz)",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is any of",
    );

    const valueInput = screen.getByRole("textbox", { name: "Value" });
    await user.type(valueInput, "5,");

    expect(valueInput).toHaveValue("5,");

    await user.type(valueInput, " 1");
    expect(valueInput).toHaveValue("5, 1");

    await expectProductNames(["Headphones", "Keyboard", "Key"]);
  });

  it("resets the 'Is any of' free-text value when switching operators or properties", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "Product Name",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is any of",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Value" }),
      "Headphones, Key",
    );

    // Switching away and back to "Is any of" should not carry over the
    // previous free text (the condition's value was reset to undefined).
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Contains",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is any of",
    );

    expect(screen.getByRole("textbox", { name: "Value" })).toHaveValue("");
  });

  it("restores the full list when a completed condition is changed back to an incomplete one", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForCatalog();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "Product Name",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Equals",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Value" }),
      "Headphones",
    );
    await expectProductNames(["Headphones"]);

    // Switching to an operator that still needs a value (but hasn't got
    // one yet) should behave like a partial condition again, not keep
    // the previous filtered result around.
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Contains",
    );

    await expectProductNames(FULL_LIST);
  });

  it("sends `condition` to the `Products` query only once it's complete, shaped as {propertyId, operatorId, value}", async () => {
    const seenConditions: (ConditionInput | null | undefined)[] = [];
    server.use(
      graphql.query<
        { products: unknown[] },
        { condition?: ConditionInput | null }
      >("Products", ({ variables }) => {
        seenConditions.push(variables.condition);
        return HttpResponse.json({ data: { products: [] } });
      }),
    );

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("combobox", { name: "Property" });
    // The initial mount fetch: no condition yet.
    await waitFor(() => expect(seenConditions).toHaveLength(1));
    expect(seenConditions[0]).toBeUndefined();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "weight (oz)",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Is greater than",
    );
    // Property + operator picked, no value yet — must not have triggered
    // another `Products` request (an incomplete condition is equivalent
    // to no condition, so there's nothing new to ask the server for).
    expect(seenConditions).toHaveLength(1);

    await user.type(screen.getByRole("spinbutton", { name: "Value" }), "4");

    await waitFor(() => expect(seenConditions).toHaveLength(2));
    expect(seenConditions[1]).toEqual({
      propertyId: 2,
      operatorId: "greater_than",
      value: 4,
    });
  });
});
