import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // Push the bulkiest dep (Recharts + d3 transitive deps) into its own
    // chunk so the initial paint can come from a smaller bundle. Browsers
    // can fetch these chunks in parallel with the main entry, so cold-load
    // feels faster even though total bytes are similar.
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        manualChunks(id) {
          // Only split the heaviest dep (Recharts + its d3 / victory /
          // internmap / decimal.js transitive surface) into its own chunk.
          // Aggressive splits beyond this introduced circular-chunk warnings
          // because motion / lucide / recharts all import react. Letting
          // Rollup co-locate everything else with the entry chunk is fine
          // for our scale.
          if (
            id.includes("node_modules") &&
            (id.includes("recharts") ||
              id.includes("/d3-") ||
              id.includes("/victory-") ||
              id.includes("/internmap/") ||
              id.includes("/decimal.js"))
          ) {
            return "vendor-recharts";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    css: false,
  },
});
