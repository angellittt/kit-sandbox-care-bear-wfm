import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Each test spawns a fresh Node process. That takes ~2s on a laptop but can
// pass Vitest's 5s default when every package's tests run at once (turbo
// under act in Docker), so give each test more headroom.
vi.setConfig({ testTimeout: 30_000 });

const hook = (name: string) =>
  fileURLToPath(new URL(`../bin/${name}.ts`, import.meta.url));

let tmp = "";
let repo = "";

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();

const runHook = (name: string, input: unknown) =>
  spawnSync(process.execPath, [hook(name)], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });

const bash = (command: string) =>
  runHook("pre-bash", {
    cwd: repo,
    tool_name: "Bash",
    tool_input: { command },
  });

const push = () => bash("git push");

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "push-gate-"));
  repo = join(tmp, "repo");
  execFileSync("mkdir", ["-p", repo]);
  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  git("config", "commit.gpgsign", "false");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is inside the mkdtempSync dir above
  writeFileSync(join(repo, "a.txt"), "a\n");
  git("add", "a.txt");
  git("commit", "-q", "-m", "init");
});

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("push gate (as Claude Code runs it)", () => {
  it("blocks git push until pnpm ci:local has passed", () => {
    const result = push();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("pnpm ci:local");
  });

  it("allows git push once the stamp matches a clean HEAD", () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is inside the mkdtempSync dir above
    writeFileSync(
      join(repo, ".git/ci-local-pass"),
      `${git("rev-parse", "HEAD")}\n`,
    );
    expect(push().status).toBe(0);
  });

  it("blocks the human-only hotfix skip, even with a valid stamp", () => {
    const result = bash("SKIP_CI_LOCAL=1 git push");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SKIP_CI_LOCAL=1");
  });

  it("blocks again after a new commit", () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is inside the mkdtempSync dir above
    writeFileSync(join(repo, "a.txt"), "b\n");
    git("commit", "-q", "-am", "next");
    expect(push().status).toBe(2);
  });
});

describe("pre-bash hook", () => {
  it("blocks writing the stamp from Bash", () => {
    const result = runHook("pre-bash", {
      cwd: repo,
      tool_input: { command: "git rev-parse HEAD > .git/ci-local-pass" },
    });
    expect(result.status).toBe(2);
  });
});

describe("pre-edit hook", () => {
  it("blocks Write on the stamp file", () => {
    const result = runHook("pre-edit", {
      tool_name: "Write",
      tool_input: { file_path: join(repo, ".git/ci-local-pass"), content: "x" },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("pnpm ci:local");
  });

  it("allows other edits", () => {
    const result = runHook("pre-edit", {
      tool_name: "Edit",
      tool_input: { file_path: join(repo, "a.txt") },
    });
    expect(result.status).toBe(0);
  });
});
