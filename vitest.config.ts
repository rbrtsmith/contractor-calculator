import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    exclude: ["**/node_modules/**", "**/e2e/**"],
    browser: {
      enabled: true,
      provider: playwright,
      instances: [{ browser: "chromium" }],
    },
  },
});
