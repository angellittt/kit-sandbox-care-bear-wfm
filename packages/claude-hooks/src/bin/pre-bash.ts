// PreToolUse hook on Bash: blocks commands that skip the git hooks, that
// write the local CI pass stamp, or that push / open a PR before
// `pnpm ci:local` has passed for the current commit.
// Wired up in .claude/settings.json.
import { findBypass } from "../bypass.ts";
import { OK, exitWith, readHookInput } from "../hook-io.ts";
import { findUnverifiedPush } from "../push-gate.ts";
import { findStampWrite } from "../stamp-guard.ts";

const input = readHookInput();
const command = input?.tool_input?.command;
const reason =
  typeof command === "string"
    ? (findBypass(command) ??
      findStampWrite(command) ??
      findUnverifiedPush(command, input?.cwd ?? process.cwd()))
    : null;

exitWith(reason === null ? OK : { exitCode: 2, stdout: "", stderr: reason });
