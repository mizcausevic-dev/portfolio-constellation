import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

/**
 * Server-side prerender entry. Effects do not run during renderToString, so the
 * App's live-refetch useEffect is skipped and this captures the baked snapshot
 * (the cleaned set) - exactly what crawlers should see. The client hydrates the
 * same tree and then upgrades it via the live refetch.
 */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
