// Wire @testing-library/jest-dom matchers into Vitest's `expect`. Loaded
// automatically by vitest.config.ts so individual test files don't need
// to import this themselves.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Auto-unmount components between tests so DOM queries don't see leftover
// nodes from a previous render. testing-library/react ships an automatic
// cleanup that detects Jest's `afterEach`; we register it explicitly so
// Vitest gets the same behaviour.
afterEach(() => {
  cleanup();
});
