import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function enableMocking() {
  // The mocked GraphQL API only needs to run in dev — production builds
  // would point `GRAPHQL_ENDPOINT` at a real server, and tests wire up
  // their own MSW `setupServer` instance (see `setupTests.ts`).
  if (!import.meta.env.DEV) return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
