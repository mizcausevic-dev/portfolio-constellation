import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./styles.command-center.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element not found");

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered HTML present -> hydrate; empty (dev) -> client render.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
