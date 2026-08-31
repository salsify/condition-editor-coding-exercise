import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Enable API mocking before all tests, reset any request handlers added in
// individual tests so they don't leak between tests, and clean up once
// tests are done.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// With `test.globals: false`, RTL's own auto-cleanup (which relies on a
// global `afterEach`) never registers, so each rendered component would
// otherwise leak into the next test.
afterEach(() => cleanup());
