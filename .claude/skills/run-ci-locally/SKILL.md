---
name: run-ci-locally
description: Run this repo's GitHub Actions PR checks locally with act (`pnpm ci:local`) and get them green before pushing. Use before any `git push` or `gh pr create`, when a push or PR is blocked by the local CI gate, or when asked to check that CI will pass.
---

# Run CI locally

You can't `git push` or `gh pr create` in this repo until every PR check passes locally for the exact commit you push. A Claude Code hook and the git pre-push hook both enforce it. This skill is how you get there.

## When

- Before every push or PR. Also after any new commit: a new commit makes the old pass stale.
- When a push was blocked with "blocked until every PR check passes locally".

## Loop

1. Commit everything. `git status` must be clean (no untracked files either). A run with uncommitted changes can pass, but it writes no stamp, so the push stays blocked.
2. Run `pnpm ci:local` **in the background** (it takes several minutes, longer than a foreground command may run). It runs every workflow in `.github/workflows/` with a `pull_request` trigger under act, fastest first, then `scripts/e2e-ci.sh`. It stops at the first failure and prints a summary:
   ```
   ci:local summary:
     pass  .github/workflows/typecheck.yml
     FAIL  .github/workflows/lint.yml
     skip  .github/workflows/e2e.yml (an earlier check failed; --keep-going runs it anyway)
   ```
3. If everything passed, it says `Stamped <sha>, so it can be pushed.` Push now, as its own command. Don't chain it after a commit (`git commit ... && git push`): the gate checks before the commit runs, so it sees the old HEAD.
4. If something failed, fix it, commit, and go back to step 2. Use `pnpm ci:local --keep-going` when you want every failure in one run.

## Reading failures

- Scroll up from the summary to the `==> ci:local: <workflow>` header of the failing workflow. act prefixes each line with `[<workflow>/<job>]` and marks failed steps with `❌`. Find the first step that failed and read its output, not the last line.
- Most failures are the same as the pnpm script the step runs (`pnpm typecheck`, `pnpm lint`, `pnpm run test`, `scripts/e2e-ci.sh`). Reproduce with that script directly, it's faster than a container. Then fix and re-run.
- To re-run only the workflow you fixed while iterating: `pnpm ci:local .github/workflows/<file>.yml`. This never writes a stamp, so finish with a full `pnpm ci:local` before pushing.
- If a step fails only under act (setup, YAML, a missing tool), check whether the same workflow passes on GitHub. If it does, it's a difference between act and GitHub's runner: stop and tell the developer instead of editing the workflow to dodge it.

## Don't

- Don't write, copy or touch `.git/ci-local-pass`. Only `pnpm ci:local` writes it. The hooks block it anyway.
- Don't skip, disable or weaken a workflow, job or test to get green. Don't add an `if: ${{ !env.ACT }}` that skips a real check locally; that's only for steps that need a real PR (comments, commit statuses). The one exception is a step whose action can't start under act and can never fail a PR, like the React Doctor scan in `react-doctor-web.yml` (`blocking: none`). Ask the developer before adding another.
- Don't use `SKIP_CI_LOCAL`, `--no-verify` or `LEFTHOOK=0`. `SKIP_CI_LOCAL=1` is for humans pushing production hotfixes, never for agents. The hooks block all three.

## When to stop and ask the developer

- `pnpm ci:local` says act isn't installed or Docker isn't running. Show them the setup steps it printed (`mise install`, start Docker). You can't start Docker for them.
- On an Apple Silicon Mac, errors like `exec format error`: Rosetta (x86/amd64 emulation) is off in Docker. Ask them to turn it on.
- The same failure keeps coming back after two or three honest fixes, or it's in code you don't own. Explain what you found instead of looping.
