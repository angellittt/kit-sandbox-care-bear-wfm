#!/usr/bin/env bash

# Runs this repo's pull_request checks locally, the way GitHub Actions runs
# them: every pull_request workflow under act (https://github.com/nektos/act)
# in Docker, then the E2E suite through scripts/e2e-ci.sh.
#
#   pnpm ci:local                                    every check, stop at the first failure
#   pnpm ci:local --keep-going                       every check, report all failures
#   pnpm ci:local .github/workflows/typecheck.yml    just that one
#
# e2e.yml only calls scripts/e2e-ci.sh, which starts its own Docker Compose
# stack, so it runs natively instead of inside an act container.
#
# Exits non-zero if any check fails. When every check passes on a clean
# working tree, it writes a pass stamp (the current commit SHA) to
# .git/ci-local-pass. The git pre-push hook (scripts/ci-local/pre-push.sh)
# and the Claude Code push gate (packages/claude-hooks) only let a push
# through when that stamp matches HEAD.
#
# Written for bash 3.2 too (the default /bin/bash on macOS): no `mapfile`, and
# arrays that may be empty expand as ${ARR[@]+"${ARR[@]}"} so `set -u` is happy.

set -uo pipefail

STAMP_NAME="ci-local-pass"
E2E_WORKFLOW=".github/workflows/e2e.yml"

# Fastest first, so a typo fails in seconds instead of after E2E. Workflows
# not listed here run after these, in name order.
ORDER="typecheck lint terraform code-coverage react-doctor-web sbom-source"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ci:local: run this from inside the repo." >&2
  exit 1
}
cd "$ROOT" || exit 1

setup_steps() {
  cat >&2 <<'MSG'

Local CI setup:
  1. Install the pinned tools, act included:  mise install
  2. Start Docker (Docker Desktop or OrbStack on macOS, the Docker engine on
     Linux) and check that `docker info` works.
  3. On Windows, run everything from WSL2 with Docker Desktop's WSL backend.
See "Local CI with act" in the Readme.
MSG
}

# Succeeds if the workflow file has a pull_request trigger in its `on:` key:
# `on: pull_request`, `on: [push, pull_request]`, or a `pull_request:` (or
# `- pull_request`) entry in an `on:` block. pull_request_target doesn't count.
is_pr_workflow() {
  awk -v q="'" '
    function has_pr(s) { return s ~ /(^|[^A-Za-z0-9_-])pull_request([^A-Za-z0-9_-]|$)/ }
    {
      line = $0
      if (line ~ /^[ \t]*#/) next
      sub(/[ \t]+#.*$/, "", line)
    }
    line ~ /^("on"|on):/ || line ~ ("^" q "on" q ":") {
      value = line
      sub(/^[^:]*:[ \t]*/, "", value)
      if (value != "") { if (has_pr(value)) found = 1; in_on = 0 } else { in_on = 1; child = -1 }
      next
    }
    in_on && line ~ /^[^ \t]/ { in_on = 0 }
    in_on && line ~ /[^ \t]/ {
      match(line, /^[ \t]*/)
      if (child < 0) child = RLENGTH
      if (RLENGTH == child) {
        key = line
        sub(/^[ \t]*(-[ \t]+)?/, "", key)
        sub(/[ \t]*:.*$/, "", key)
        gsub(/"/, "", key)
        gsub(q, "", key)
        if (key == "pull_request") found = 1
      }
    }
    END { exit found ? 0 : 1 }
  ' "$1"
}

pr_workflows() {
  local file
  for file in .github/workflows/*.yml .github/workflows/*.yaml; do
    [ -f "$file" ] && is_pr_workflow "$file" && echo "$file"
  done
}

# Prints the pull_request workflows in run order: the ones in $ORDER first,
# then the rest by name.
ordered_pr_workflows() {
  local all name file
  all="$(pr_workflows)"
  for name in $ORDER; do
    for file in ".github/workflows/$name.yml" ".github/workflows/$name.yaml"; do
      printf '%s\n' "$all" | grep -qxF "$file" && echo "$file"
    done
  done
  printf '%s\n' "$all" | while IFS= read -r file; do
    [ -n "$file" ] || continue
    name="$(basename "$file")"
    name="${name%.*}"
    case " $ORDER " in *" $name "*) ;; *) echo "$file" ;; esac
  done
}

# Escapes a string for a JSON string literal.
json_string() {
  printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"
}

# Writes the pull_request event payload act gets. Without one, actions like
# react-doctor have no base SHA to diff against. Number 0 means "no real PR";
# GitHub-only steps (PR comments, commit statuses) skip themselves with
# `if: ${{ !env.ACT }}`.
# The branch PRs merge into: origin's default branch, or main.
base_branch() {
  local base_ref
  base_ref="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"
  base_ref="${base_ref#origin/}"
  echo "${base_ref:-main}"
}

write_payload() {
  local base_ref head_ref head_sha base_sha
  base_ref="$(base_branch)"
  head_ref="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo HEAD)"
  head_sha="$(git rev-parse HEAD)"
  base_sha="$(git merge-base HEAD "origin/$base_ref" 2>/dev/null || echo "$head_sha")"
  cat > "$1" <<JSON
{
  "action": "synchronize",
  "number": 0,
  "pull_request": {
    "number": 0,
    "base": { "ref": $(json_string "$base_ref"), "sha": "$base_sha" },
    "head": { "ref": $(json_string "$head_ref"), "sha": "$head_sha" }
  }
}
JSON
}

# The tree is clean when there is nothing to commit, untracked files included:
# act copies the working tree (minus .gitignore'd files) into its containers,
# so untracked files would count.
tree_is_clean() {
  [ -z "$(git status --porcelain 2>/dev/null)" ]
}

KEEP_GOING=0
WORKFLOWS=()
for arg in "$@"; do
  case "$arg" in
    --keep-going) KEEP_GOING=1 ;;
    -*)
      echo "ci:local: unknown option $arg" >&2
      exit 1
      ;;
    *) WORKFLOWS+=("$arg") ;;
  esac
done

if ! command -v act >/dev/null 2>&1; then
  echo "ci:local: act isn't installed (no \`act\` on PATH)." >&2
  setup_steps
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ci:local: Docker isn't running (\`docker info\` failed)." >&2
  setup_steps
  exit 1
fi

STAMP_FILE="$(git rev-parse --git-path "$STAMP_NAME")"
FULL_RUN=0
if [ "${#WORKFLOWS[@]}" -eq 0 ]; then
  FULL_RUN=1
  # A new full run replaces any earlier result, even for the same commit.
  rm -f "$STAMP_FILE"
  while IFS= read -r workflow; do WORKFLOWS+=("$workflow"); done < <(ordered_pr_workflows)
  if [ "${#WORKFLOWS[@]}" -eq 0 ]; then
    echo "ci:local: no pull_request workflows found in .github/workflows." >&2
    exit 1
  fi
fi

# E2E goes last: it's the slowest check by far.
CHECKS=()
RUN_E2E=0
for workflow in "${WORKFLOWS[@]}"; do
  if [ "${workflow#./}" = "$E2E_WORKFLOW" ]; then RUN_E2E=1; else CHECKS+=("$workflow"); fi
done
[ "$RUN_E2E" -eq 1 ] && CHECKS+=("$E2E_WORKFLOW")

START_HEAD="$(git rev-parse HEAD 2>/dev/null)"
START_CLEAN=0
tree_is_clean && START_CLEAN=1

# Outside the working tree, so the run never makes it dirty.
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
PAYLOAD="$WORK_DIR/event.json"
write_payload "$PAYLOAD"

# In a git worktree, .git is a file pointing into the main checkout's .git
# folder, which act doesn't copy into its containers, so git (and every check
# that asks git where the repo is) fails inside the jobs. Mount that folder
# read-only at the same path.
ACT_ARGS=()
if [ -f .git ]; then
  COMMON_DIR="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
  ACT_ARGS+=(--container-options "-v $COMMON_DIR:$COMMON_DIR:ro")
fi

# act's artifact server always listens on port 34567, so two runs at once
# (say, two worktrees) would clash. Ask the OS for a free port instead.
free_port() {
  node -e 'const s = require("net").createServer().listen(0, () => { console.log(s.address().port); s.close(); })' 2>/dev/null
}
PORT="$(free_port)"
[ -n "$PORT" ] && ACT_ARGS+=(--artifact-server-port "$PORT")

run_check() {
  if [ "$1" = "$E2E_WORKFLOW" ]; then
    ./scripts/e2e-ci.sh
  else
    # The artifact server lets upload-artifact@v4 steps work.
    act pull_request -W "$1" -e "$PAYLOAD" --artifact-server-path "$WORK_DIR/artifacts" \
      ${ACT_ARGS[@]+"${ACT_ARGS[@]}"} 2>&1 | tee "$WORK_DIR/act.log"
    [ "${PIPESTATUS[0]}" -eq 0 ] || return 1
    # act skips a job whose runs-on has no image (macOS, Windows, self-hosted)
    # and still exits 0. A job that never ran must not count as a pass.
    if grep -q 'Skipping unsupported platform' "$WORK_DIR/act.log"; then
      echo "ci:local: act skipped a job in $1 (no image for its runs-on), so it didn't run." >&2
      return 1
    fi
  fi
}

PASSED=()
FAILED=()
SKIPPED=()
for check in "${CHECKS[@]}"; do
  if [ "${#FAILED[@]}" -gt 0 ] && [ "$KEEP_GOING" -eq 0 ]; then
    SKIPPED+=("$check")
    continue
  fi
  echo "==> ci:local: $check"
  if run_check "$check"; then
    PASSED+=("$check")
  else
    FAILED+=("$check")
  fi
done

echo
echo "ci:local summary:"
for check in ${PASSED[@]+"${PASSED[@]}"}; do echo "  pass  $check"; done
for check in ${FAILED[@]+"${FAILED[@]}"}; do echo "  FAIL  $check"; done
for check in ${SKIPPED[@]+"${SKIPPED[@]}"}; do echo "  skip  $check (an earlier check failed; --keep-going runs it anyway)"; done

if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "ci:local: ${#FAILED[@]} check(s) failed. Fix them and run pnpm ci:local again." >&2
  exit 1
fi

# GitHub checks the PR merged with its base branch; this run checks HEAD alone.
BASE_BRANCH="$(base_branch)"
if git rev-parse --verify --quiet "origin/$BASE_BRANCH" >/dev/null &&
  ! git merge-base --is-ancestor "origin/$BASE_BRANCH" HEAD 2>/dev/null; then
  echo "ci:local: warning: origin/$BASE_BRANCH has commits this branch doesn't. GitHub checks" \
    "your PR merged with it, so rebase onto origin/$BASE_BRANCH before you trust this result."
fi

if [ "$FULL_RUN" -eq 0 ]; then
  echo "ci:local: passed. No pass stamp: only a full \`pnpm ci:local\` run writes one."
elif [ "$START_CLEAN" -eq 1 ] && tree_is_clean &&
  [ "$(git rev-parse HEAD 2>/dev/null)" = "$START_HEAD" ]; then
  echo "$START_HEAD" > "$STAMP_FILE"
  echo "ci:local: every check passed. Stamped $START_HEAD, so it can be pushed."
else
  echo "ci:local: every check passed, but the working tree had uncommitted changes (or HEAD moved)," \
    "so there is no pass stamp. Commit, then run pnpm ci:local again before pushing."
fi
