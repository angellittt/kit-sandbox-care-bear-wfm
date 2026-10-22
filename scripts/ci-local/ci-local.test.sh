#!/usr/bin/env bash

# Standalone tests for ci-local.sh. Each test builds a tiny git repo in a temp
# dir with a few workflows and a fake scripts/e2e-ci.sh, puts a fake `act` and
# `docker` on PATH (they log their arguments and fail on request), and checks
# what ci-local.sh ran, in what order, its exit code and the pass stamp.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_LOCAL="${SCRIPT_DIR}/ci-local.sh"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

FAKE_BIN="$TEST_TMP/bin"
BASE_PATH="/usr/local/bin:/usr/bin:/bin"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

# Fake act: appends "act <workflow>" to $FAKE_LOG and copies the `-e` payload
# to $FAKE_LOG.payload. Fails for any workflow path containing $FAKE_FAIL, and
# logs act's unsupported-platform skip (exiting 0) for one containing $FAKE_SKIP.
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/act" <<'SH'
#!/usr/bin/env bash
workflow=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -W) workflow="$2"; shift 2 ;;
    -e) cp "$2" "$FAKE_LOG.payload"; shift 2 ;;
    *) shift ;;
  esac
done
echo "act $workflow" >> "$FAKE_LOG"
if [ -n "${FAKE_FAIL:-}" ] && [[ "$workflow" == *"$FAKE_FAIL"* ]]; then exit 1; fi
if [ -n "${FAKE_SKIP:-}" ] && [[ "$workflow" == *"$FAKE_SKIP"* ]]; then
  echo "[Block/mac] 🚧  Skipping unsupported platform -- Try running with \`-P macos-latest=...\`"
fi
exit 0
SH
# Fake docker: `docker info` fails when $FAKE_DOCKER_DOWN is set.
cat > "$FAKE_BIN/docker" <<'SH'
#!/usr/bin/env bash
[ -z "${FAKE_DOCKER_DOWN:-}" ]
SH
chmod +x "$FAKE_BIN/act" "$FAKE_BIN/docker"

create_repo() {
  local repo="$1"
  mkdir -p "$repo/.github/workflows" "$repo/scripts"
  git -C "$repo" init -q -b main
  git -C "$repo" config user.email test@example.com
  git -C "$repo" config user.name test
  git -C "$repo" config commit.gpgsign false
  git -C "$repo" remote add origin https://github.com/acme/widgets.git

  cat > "$repo/.github/workflows/block.yml" <<'YAML'
name: Block form
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs: {}
YAML
  cat > "$repo/.github/workflows/inline.yml" <<'YAML'
on: [push, pull_request] # both
jobs: {}
YAML
  cat > "$repo/.github/workflows/list.yaml" <<'YAML'
"on":
  - push
  - pull_request
jobs: {}
YAML
  # Listed in ci-local.sh's ORDER, so it runs before the alphabetical rest.
  cat > "$repo/.github/workflows/typecheck.yml" <<'YAML'
on: pull_request
jobs: {}
YAML
  # Runs natively through scripts/e2e-ci.sh, last.
  cat > "$repo/.github/workflows/e2e.yml" <<'YAML'
on: pull_request
jobs: {}
YAML
  cat > "$repo/.github/workflows/deploy.yml" <<'YAML'
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      pull_request:
        description: a nested key, not a trigger
jobs: {}
YAML
  cat > "$repo/.github/workflows/target.yml" <<'YAML'
on:
  pull_request_target:
jobs:
  x:
    # pull_request: in a comment
    steps: []
YAML
  cat > "$repo/scripts/e2e-ci.sh" <<'SH'
#!/usr/bin/env bash
echo "e2e-ci.sh" >> "$FAKE_LOG"
[ -z "${FAKE_E2E_FAIL:-}" ]
SH
  chmod +x "$repo/scripts/e2e-ci.sh"
  git -C "$repo" add -A
  git -C "$repo" commit -q -m init
}

# run_ci_local <repo> <output-file> [args...]; returns ci-local.sh's exit code.
run_ci_local() {
  local repo="$1" output_file="$2"
  shift 2
  set +e
  (cd "$repo" && PATH="${TEST_PATH:-$FAKE_BIN:$BASE_PATH}" FAKE_LOG="$repo.log" \
    bash "$CI_LOCAL" "$@") > "$output_file" 2>&1
  local status=$?
  set -e
  return "$status"
}

ran() {
  cat "$1.log" 2>/dev/null || true
}

stamp_of() {
  cat "$1/.git/ci-local-pass" 2>/dev/null || true
}

ALL_CHECKS="act .github/workflows/typecheck.yml
act .github/workflows/block.yml
act .github/workflows/inline.yml
act .github/workflows/list.yaml
e2e-ci.sh"

test_runs_pull_request_workflows_in_order_with_e2e_last() {
  local repo="$TEST_TMP/discover"
  create_repo "$repo"

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  [ "$(ran "$repo")" = "$ALL_CHECKS" ] ||
    fail "expected typecheck, block, inline, list, then e2e, got: $(ran "$repo")"
}

test_passes_a_pull_request_payload_with_the_merge_base() {
  local repo="$TEST_TMP/payload"
  create_repo "$repo"
  local base
  base="$(git -C "$repo" rev-parse HEAD)"
  git -C "$repo" update-ref refs/remotes/origin/main "$base"
  git -C "$repo" checkout -q -b feat/x
  git -C "$repo" commit -q --allow-empty -m change

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  local payload
  payload="$(tr -d ' \n' < "$repo.log.payload")"
  [[ "$payload" == *'"pull_request":{"number":0,'* ]] ||
    fail "expected PR number 0, got: $payload"
  [[ "$payload" == *"\"base\":{\"ref\":\"main\",\"sha\":\"$base\"}"* ]] ||
    fail "expected base main at $base, got: $payload"
  [[ "$payload" == *"\"head\":{\"ref\":\"feat/x\",\"sha\":\"$(git -C "$repo" rev-parse HEAD)\"}"* ]] ||
    fail "expected head feat/x at HEAD, got: $payload"
}

test_stamps_head_after_a_clean_full_pass() {
  local repo="$TEST_TMP/stamp"
  create_repo "$repo"

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  [ "$(stamp_of "$repo")" = "$(git -C "$repo" rev-parse HEAD)" ] ||
    fail "expected the stamp to hold HEAD, got: '$(stamp_of "$repo")'"
}

test_single_workflow_runs_only_that_one_and_does_not_stamp() {
  local repo="$TEST_TMP/single"
  create_repo "$repo"

  run_ci_local "$repo" "$repo.out" .github/workflows/block.yml ||
    fail "expected pass, got: $(cat "$repo.out")"
  [ "$(ran "$repo")" = "act .github/workflows/block.yml" ] ||
    fail "expected only block.yml, got: $(ran "$repo")"
  [ -z "$(stamp_of "$repo")" ] || fail "a partial run must not write a stamp"
}

test_e2e_workflow_runs_e2e_ci_natively() {
  local repo="$TEST_TMP/single-e2e"
  create_repo "$repo"

  run_ci_local "$repo" "$repo.out" .github/workflows/e2e.yml ||
    fail "expected pass, got: $(cat "$repo.out")"
  [ "$(ran "$repo")" = "e2e-ci.sh" ] || fail "expected e2e-ci.sh only, got: $(ran "$repo")"
}

test_stops_at_the_first_failure() {
  local repo="$TEST_TMP/fail-fast"
  create_repo "$repo"

  if FAKE_FAIL=typecheck.yml run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit when a workflow fails"
  fi
  [ "$(ran "$repo")" = "act .github/workflows/typecheck.yml" ] ||
    fail "expected nothing to run after typecheck failed, got: $(ran "$repo")"
  grep -q "FAIL  .github/workflows/typecheck.yml" "$repo.out" ||
    fail "expected the summary to name typecheck.yml, got: $(cat "$repo.out")"
  grep -q "skip  .github/workflows/e2e.yml" "$repo.out" ||
    fail "expected the summary to list e2e as skipped, got: $(cat "$repo.out")"
  [ -z "$(stamp_of "$repo")" ] || fail "a failing run must not write a stamp"
}

test_keep_going_runs_every_check_after_a_failure() {
  local repo="$TEST_TMP/keep-going"
  create_repo "$repo"

  if FAKE_FAIL=block.yml run_ci_local "$repo" "$repo.out" --keep-going; then
    fail "expected a non-zero exit when a workflow fails"
  fi
  [ "$(ran "$repo")" = "$ALL_CHECKS" ] || fail "expected every check to run, got: $(ran "$repo")"
  grep -q "FAIL  .github/workflows/block.yml" "$repo.out" ||
    fail "expected the summary to name block.yml, got: $(cat "$repo.out")"
  [ -z "$(stamp_of "$repo")" ] || fail "a failing run must not write a stamp"
}

test_fails_when_e2e_fails() {
  local repo="$TEST_TMP/e2e-fail"
  create_repo "$repo"

  if FAKE_E2E_FAIL=1 run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit when e2e fails"
  fi
  [ -z "$(stamp_of "$repo")" ] || fail "a failing run must not write a stamp"
}

test_fails_when_act_skips_a_job_for_its_platform() {
  local repo="$TEST_TMP/platform-skip"
  create_repo "$repo"

  if FAKE_SKIP=block.yml run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit when act skips a job"
  fi
  grep -q "FAIL  .github/workflows/block.yml" "$repo.out" ||
    fail "expected the summary to name block.yml, got: $(cat "$repo.out")"
  grep -q "act skipped a job in .github/workflows/block.yml" "$repo.out" ||
    fail "expected the skip message, got: $(cat "$repo.out")"
  [ -z "$(stamp_of "$repo")" ] || fail "a run with a skipped job must not write a stamp"
}

test_warns_when_the_base_branch_has_moved() {
  local repo="$TEST_TMP/base-moved"
  create_repo "$repo"
  git -C "$repo" commit -q --allow-empty -m "on main only"
  git -C "$repo" update-ref refs/remotes/origin/main HEAD
  git -C "$repo" reset -q --hard HEAD~1

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  grep -q "warning: origin/main has commits this branch doesn't" "$repo.out" ||
    fail "expected the rebase warning, got: $(cat "$repo.out")"
}

test_no_warning_when_up_to_date_with_the_base_branch() {
  local repo="$TEST_TMP/base-current"
  create_repo "$repo"
  git -C "$repo" update-ref refs/remotes/origin/main HEAD

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  if grep -q "warning: origin/main" "$repo.out"; then
    fail "expected no rebase warning, got: $(cat "$repo.out")"
  fi
}

test_failing_full_run_removes_an_old_stamp() {
  local repo="$TEST_TMP/stale"
  create_repo "$repo"
  git -C "$repo" rev-parse HEAD > "$repo/.git/ci-local-pass"

  if FAKE_FAIL=inline.yml run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit"
  fi
  [ -z "$(stamp_of "$repo")" ] || fail "expected the old stamp to be removed"
}

test_does_not_stamp_a_dirty_tree() {
  local repo="$TEST_TMP/dirty"
  create_repo "$repo"
  echo "wip" > "$repo/untracked.txt"

  run_ci_local "$repo" "$repo.out" || fail "expected pass, got: $(cat "$repo.out")"
  [ -z "$(stamp_of "$repo")" ] || fail "a dirty tree must not be stamped"
  grep -q "uncommitted changes" "$repo.out" ||
    fail "expected a note about uncommitted changes, got: $(cat "$repo.out")"
}

test_blocks_with_setup_steps_when_act_is_missing() {
  local repo="$TEST_TMP/missing"
  create_repo "$repo"
  # Only the tools ci-local.sh needs before its act check. BASE_PATH alone
  # could hold a real act (Homebrew on Intel Macs, Linux packages).
  local no_act_bin="$TEST_TMP/no-act-bin" tool
  mkdir -p "$no_act_bin"
  for tool in bash git sed cat awk grep head basename dirname mktemp rm; do
    ln -sf "$(PATH="$BASE_PATH" command -v "$tool")" "$no_act_bin/$tool"
  done

  if TEST_PATH="$no_act_bin" run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit without act"
  fi
  grep -q "act isn't installed" "$repo.out" || fail "expected the act message, got: $(cat "$repo.out")"
  grep -q "mise install" "$repo.out" || fail "expected setup steps, got: $(cat "$repo.out")"
}

test_blocks_with_setup_steps_when_docker_is_down() {
  local repo="$TEST_TMP/no-docker"
  create_repo "$repo"

  if FAKE_DOCKER_DOWN=1 run_ci_local "$repo" "$repo.out"; then
    fail "expected a non-zero exit when Docker isn't running"
  fi
  grep -q "Docker isn't running" "$repo.out" || fail "expected the Docker message, got: $(cat "$repo.out")"
  [ -z "$(ran "$repo")" ] || fail "no check should run without Docker"
}

test_rejects_unknown_options() {
  local repo="$TEST_TMP/unknown"
  create_repo "$repo"

  if run_ci_local "$repo" "$repo.out" --nope; then
    fail "expected a non-zero exit for an unknown option"
  fi
  [ -z "$(ran "$repo")" ] || fail "no check should run"
}

test_runs_pull_request_workflows_in_order_with_e2e_last
test_passes_a_pull_request_payload_with_the_merge_base
test_stamps_head_after_a_clean_full_pass
test_single_workflow_runs_only_that_one_and_does_not_stamp
test_e2e_workflow_runs_e2e_ci_natively
test_stops_at_the_first_failure
test_keep_going_runs_every_check_after_a_failure
test_fails_when_e2e_fails
test_fails_when_act_skips_a_job_for_its_platform
test_warns_when_the_base_branch_has_moved
test_no_warning_when_up_to_date_with_the_base_branch
test_failing_full_run_removes_an_old_stamp
test_does_not_stamp_a_dirty_tree
test_blocks_with_setup_steps_when_act_is_missing
test_blocks_with_setup_steps_when_docker_is_down
test_rejects_unknown_options

echo "ci-local tests passed"
