import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Used only under Vitest/node (see `setupTests.ts`). */
export const server = setupServer(...handlers);
