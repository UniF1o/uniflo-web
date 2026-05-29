import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Match tsconfig.json `paths` so test files can import `@/lib/...`
      // the same way the runtime code does.
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Exclude node_modules vendor tests that get globbed otherwise.
    exclude: ["node_modules/**", ".next/**"],
  },
});
