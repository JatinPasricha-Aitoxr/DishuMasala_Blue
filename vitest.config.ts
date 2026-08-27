import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // See tests/setup/server-only-stub.ts for why.
      "server-only": path.resolve(__dirname, "./tests/setup/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    setupFiles: ["./tests/setup/load-env.ts"],
  },
});
