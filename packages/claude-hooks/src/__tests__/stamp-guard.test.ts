import { describe, expect, it } from "vitest";
import { findStampEdit, findStampWrite } from "../stamp-guard.ts";

describe("findStampWrite", () => {
  it.each([
    "echo abc > .git/ci-local-pass",
    "echo abc >.git/ci-local-pass",
    "echo abc>>.git/ci-local-pass",
    "git rev-parse HEAD > .git/ci-local-pass",
    "git rev-parse HEAD 1> .git/ci-local-pass",
    "git rev-parse HEAD | tee .git/ci-local-pass",
    "touch .git/ci-local-pass",
    "cp /tmp/x .git/ci-local-pass",
    "mv /tmp/x .git/ci-local-pass",
    "sed -i s/a/b/ .git/ci-local-pass",
    "node -e \"require('fs').writeFileSync('.git/ci-local-pass', 'x')\"",
    "f=.git/ci-local-pass; echo x > $f",
    "cat /tmp/x > '.git/ci-local-''pass'",
    "git log -1 --format=%H --output=.git/ci-local-pass",
    'bash -c "echo x > .git/ci-local-pass"',
    "pnpm test && echo x > .git/ci-local-pass",
  ])("blocks %s", (command) => {
    expect(findStampWrite(command)).toContain("pnpm ci:local");
  });

  it.each([
    "cat .git/ci-local-pass",
    "ls -l .git/ci-local-pass",
    "grep -rn ci-local-pass scripts",
    "git rev-parse --git-path ci-local-pass",
    'git commit -m "document the ci-local-pass stamp"',
    "pnpm ci:local",
    "git push",
    "cat .git/ci-local-pass > /tmp/copy",
  ])("allows %s", (command) => {
    expect(findStampWrite(command)).toBeNull();
  });
});

describe("findStampEdit", () => {
  it("blocks writing the stamp file", () => {
    expect(
      findStampEdit({ file_path: "/repo/.git/ci-local-pass", content: "x" }),
    ).not.toBeNull();
    expect(
      findStampEdit({ file_path: "/repo/.git/worktrees/w/ci-local-pass" }),
    ).not.toBeNull();
  });

  it("allows other files", () => {
    expect(findStampEdit({ file_path: "/repo/src/index.ts" })).toBeNull();
    expect(findStampEdit({ notebook_path: "/repo/a.ipynb" })).toBeNull();
    expect(findStampEdit(undefined)).toBeNull();
  });
});
