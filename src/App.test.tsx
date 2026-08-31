import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

/**
 * These are component/integration tests: `App` renders for real, fetches
 * the catalog through the real `graphql-request` client, and MSW (wired up
 * globally in `setupTests.ts`) intercepts that GraphQL request and returns
 * the mock catalog — nothing about the datastore is stubbed at the React
 * level.
 */

function getProductNames(): string[] {
  const table = screen.getByRole("table");
  const rows = within(table).getAllByRole("row").slice(1); // skip header row
  return rows.map((row) => within(row).getAllByRole("cell")[0].textContent!);
}

async function waitForCatalog() {
  await screen.findByRole("combobox", { name: "Property" });
}

describe("App", () => {
  it("shows every product before any filter is applied", async () => {
    render(<App />);
    await waitForCatalog();

    expect(getProductNames().sort()).toEqual(
      [
        "Cell Phone",
        "Cup",
        "Hammer",
        "Headphones",
        "Key",
        "Keyboard",
      ].sort(),
    );
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
    // default operator is pre-filled with no value) — full list still.
    expect(getProductNames().sort()).toEqual(
      [
        "Cell Phone",
        "Cup",
        "Hammer",
        "Headphones",
        "Key",
        "Keyboard",
      ].sort(),
    );
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
    expect(getProductNames().sort()).toEqual(
      [
        "Cell Phone",
        "Cup",
        "Hammer",
        "Headphones",
        "Key",
        "Keyboard",
      ].sort(),
    );
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

    expect(getProductNames().sort()).toEqual(
      ["Hammer", "Headphones", "Keyboard"].sort(),
    );
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

    expect(getProductNames().sort()).toEqual(["Cell Phone", "Headphones"]);
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
    expect(getProductNames().sort()).toEqual(
      ["Cell Phone", "Headphones", "Keyboard"].sort(),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Has no value",
    );
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    expect(getProductNames().sort()).toEqual(["Cup", "Hammer", "Key"].sort());
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

    expect(getProductNames().sort()).toEqual(["Cup", "Hammer", "Key"].sort());
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
    expect(getProductNames()).toEqual(["Headphones"]);

    await user.click(screen.getByRole("button", { name: "Clear filter" }));

    expect(getProductNames().sort()).toEqual(
      [
        "Cell Phone",
        "Cup",
        "Hammer",
        "Headphones",
        "Key",
        "Keyboard",
      ].sort(),
    );
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

    expect(getProductNames().sort()).toEqual(["Headphones", "Key"].sort());
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

    expect(getProductNames().sort()).toEqual(
      ["Headphones", "Keyboard", "Key"].sort(),
    );
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
    expect(getProductNames()).toEqual(["Headphones"]);

    // Switching to an operator that still needs a value (but hasn't got
    // one yet) should behave like a partial condition again, not keep
    // the previous filtered result around.
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Operator" }),
      "Contains",
    );

    expect(getProductNames().sort()).toEqual(
      [
        "Cell Phone",
        "Cup",
        "Hammer",
        "Headphones",
        "Key",
        "Keyboard",
      ].sort(),
    );
  });
});
