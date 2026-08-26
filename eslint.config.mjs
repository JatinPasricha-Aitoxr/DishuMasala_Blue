import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // CLAUDE.md §3.2: "No component, page or route handler builds a query inline. No ORM import
  // outside lib/db/." Nothing outside lib/db/ may import drizzle-orm, full stop — everything else
  // consumes lib/db/queries/*, lib/db/mutations/* or the domain types in types/.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["lib/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "drizzle-orm",
              message: "Import drizzle-orm only inside lib/db/ — use lib/db/queries or lib/db/mutations instead.",
            },
          ],
          patterns: [
            {
              group: ["drizzle-orm/*"],
              message: "Import drizzle-orm only inside lib/db/ — use lib/db/queries or lib/db/mutations instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
