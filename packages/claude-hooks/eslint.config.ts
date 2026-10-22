import baseEslintConfig from "@repo/eslint-config/eslint.base.config";
import { defineConfig, globalIgnores } from "eslint/config";
export default defineConfig([
  // The tests write probe folders while `pnpm verify` lints in parallel.
  // coverage/ is ignored by the shared base config.
  globalIgnores([".tmp-*"]),
  ...baseEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
