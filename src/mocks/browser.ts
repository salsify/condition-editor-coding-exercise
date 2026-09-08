import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Used only in the Vite dev server (see `main.tsx`). */
export const worker = setupWorker(...handlers);
