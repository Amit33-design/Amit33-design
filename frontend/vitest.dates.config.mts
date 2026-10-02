import { defineConfig } from "vitest/config";

// Used by scripts/test-dates.mjs: the normal suite, with Date pinned to FAKE_DATE.
export default defineConfig({
  test: { setupFiles: ["./src/test/fake-date.setup.ts"] },
});
