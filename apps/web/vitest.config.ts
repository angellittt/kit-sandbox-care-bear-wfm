import { fileURLToPath } from "node:url";
import { uiConfig } from "@repo/vitest-config/ui";
import { coverageConfigDefaults, mergeConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default mergeConfig(uiConfig, {
  // svgr() mirrors vite.config.ts so `*.svg?react` imports resolve the same
  // way under test as they do at build/dev time.
  plugins: [tsconfigPaths(), svgr()],
  // Same as vite.config.ts: load the shared root .env.test under test.
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    exclude: ["dist", "node_modules"],
    coverage: {
      // scripts/ holds the design system kit's CI check (ds-validate.mjs and
      // its drift test): a kit tool the app's own tests never exercise.
      exclude: [...coverageConfigDefaults.exclude, "scripts/**"],
    },
  },
});
