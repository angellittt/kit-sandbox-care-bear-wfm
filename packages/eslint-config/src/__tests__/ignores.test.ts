import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ESLint, type Linter } from "eslint";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import baseConfig from "../eslint.base.config.js";
import reactConfig from "../eslint.react.config.js";

// Each package's tests write and then delete coverage/ while `pnpm verify`
// lints the same package in parallel. If ESLint walks into coverage/ it can
// crash with ENOENT, so the shared configs must ignore it.
describe.each([
  ["base", baseConfig],
  ["react", reactConfig],
])("%s config ignores", (_name, config) => {
  let cwd: string;
  let eslint: ESLint;

  beforeAll(async () => {
    cwd = await mkdtemp(path.join(tmpdir(), "eslint-config-ignores-"));
    eslint = new ESLint({
      cwd,
      overrideConfigFile: true,
      overrideConfig: config as Linter.Config[],
    });
  });

  afterAll(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it.each([
    "coverage/block-navigation.js",
    "coverage/lcov-report/prettify.js",
    "dist/index.js",
  ])("%s", async (file) => {
    await expect(eslint.isPathIgnored(path.join(cwd, file))).resolves.toBe(
      true,
    );
  });

  it("still lints source files", async () => {
    await expect(
      eslint.isPathIgnored(path.join(cwd, "src/index.ts")),
    ).resolves.toBe(false);
  });
});
