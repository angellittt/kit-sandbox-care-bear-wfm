#!/usr/bin/env bash

# Standalone tests for pre-push.sh. Each test builds a tiny git repo in a temp
# dir with a fake scripts/ci-local/ci-local.sh (it logs that it ran, then
# writes the pass stamp or fails on request), feeds pre-push.sh the stdin git
# would, and checks its exit code and whether it ran ci:local.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRE_PUSH="${SCRIPT_DIR}/pre-push.sh"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT

ZERO_SHA="0000000000000000000000000000000000000000"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

create_repo() {
  local repo="$1"
  mkdir -p "$repo/scripts/ci-local"
  git -C "$repo" init -q -b main
  git -C "$repo" config user.email test@example.com
  git -C "$repo" config user.name test
  git -C "$repo" config commit.gpgsign false
  cat > "$repo/scripts/ci-local/ci-local.sh" <<'SH'
#!/usr/bin/env bash
echo ran >> "$FAKE_LOG"
[ -z "${FAKE_FAIL:-}" ] || exit 1
git rev-parse HEAD > "$(git rev-parse --git-path ci-local-pass)"
SH
  chmod +x "$repo/scripts/ci-local/ci-local.sh"
  git -C "$repo" add -A
  git -C "$repo" commit -q -m init
}

head_of() {
  git -C "$1" rev-parse HEAD
}

# The stdin git gives pre-push for `git push origin main`.
push_line() {
  echo "refs/heads/main $(head_of "$1") refs/heads/main $ZERO_SHA"
}

# run_pre_push <repo> <stdin> <output-file>; returns pre-push.sh's exit code.
run_pre_push() {
  local repo="$1" input="$2" output_file="$3"
  set +e
  (cd "$repo" && FAKE_LOG="$repo.log" bash "$PRE_PUSH" <<< "$input") > "$output_file" 2>&1
  local status=$?
  set -e
  return "$status"
}

ran_ci_local() {
  [ -s "$1.log" ]
}

test_runs_ci_local_when_there_is_no_stamp() {
  local repo="$TEST_TMP/no-stamp"
  create_repo "$repo"

  run_pre_push "$repo" "$(push_line "$repo")" "$repo.out" ||
    fail "expected the push through after ci:local passed, got: $(cat "$repo.out")"
  ran_ci_local "$repo" || fail "expected ci:local to run"
}

test_blocks_when_ci_local_fails() {
  local repo="$TEST_TMP/ci-fails"
  create_repo "$repo"

  if FAKE_FAIL=1 run_pre_push "$repo" "$(push_line "$repo")" "$repo.out"; then
    fail "expected the push blocked when ci:local fails"
  fi
}

test_skips_ci_local_when_the_stamp_matches() {
  local repo="$TEST_TMP/stamped"
  create_repo "$repo"
  head_of "$repo" > "$repo/.git/ci-local-pass"

  run_pre_push "$repo" "$(push_line "$repo")" "$repo.out" ||
    fail "expected the push through, got: $(cat "$repo.out")"
  if ran_ci_local "$repo"; then fail "ci:local shouldn't run again for a stamped HEAD"; fi
}

test_reruns_ci_local_for_a_stale_stamp() {
  local repo="$TEST_TMP/stale"
  create_repo "$repo"
  head_of "$repo" > "$repo/.git/ci-local-pass"
  git -C "$repo" commit -q --allow-empty -m next

  run_pre_push "$repo" "$(push_line "$repo")" "$repo.out" ||
    fail "expected the push through, got: $(cat "$repo.out")"
  ran_ci_local "$repo" || fail "expected ci:local to run for the new commit"
}

test_blocks_a_dirty_tree() {
  local repo="$TEST_TMP/dirty"
  create_repo "$repo"
  echo "wip" > "$repo/wip.txt"

  if run_pre_push "$repo" "$(push_line "$repo")" "$repo.out"; then
    fail "expected a dirty tree blocked"
  fi
  grep -q "uncommitted changes" "$repo.out" || fail "expected the dirty-tree message, got: $(cat "$repo.out")"
  if ran_ci_local "$repo"; then fail "ci:local shouldn't run on a dirty tree"; fi
}

test_blocks_pushing_a_commit_other_than_head() {
  local repo="$TEST_TMP/other-ref"
  create_repo "$repo"
  local old
  old="$(head_of "$repo")"
  git -C "$repo" commit -q --allow-empty -m next

  if run_pre_push "$repo" "refs/heads/old $old refs/heads/old $ZERO_SHA" "$repo.out"; then
    fail "expected a push of a non-HEAD commit blocked"
  fi
  grep -q "isn't the checked-out commit" "$repo.out" || fail "expected the HEAD message, got: $(cat "$repo.out")"
}

test_allows_deleting_a_remote_branch() {
  local repo="$TEST_TMP/delete"
  create_repo "$repo"

  run_pre_push "$repo" "(delete) $ZERO_SHA refs/heads/old $(head_of "$repo")" "$repo.out" ||
    fail "expected a branch delete through, got: $(cat "$repo.out")"
  if ran_ci_local "$repo"; then fail "a delete pushes no commits, so ci:local shouldn't run"; fi
}

test_allows_pushing_a_tag() {
  local repo="$TEST_TMP/tag"
  create_repo "$repo"
  git -C "$repo" tag -a v1.0.0 -m v1.0.0
  git -C "$repo" commit -q --allow-empty -m next

  run_pre_push "$repo" "refs/tags/v1.0.0 $(git -C "$repo" rev-parse v1.0.0) refs/tags/v1.0.0 $ZERO_SHA" "$repo.out" ||
    fail "expected a tag push through, got: $(cat "$repo.out")"
  if ran_ci_local "$repo"; then fail "a tag push shouldn't run ci:local"; fi
}

test_skip_env_var_pushes_without_running_checks() {
  local repo="$TEST_TMP/skip"
  create_repo "$repo"

  SKIP_CI_LOCAL=1 run_pre_push "$repo" "$(push_line "$repo")" "$repo.out" ||
    fail "expected SKIP_CI_LOCAL=1 to let the push through"
  if ran_ci_local "$repo"; then fail "SKIP_CI_LOCAL=1 shouldn't run ci:local"; fi
  grep -q "production hotfixes" "$repo.out" || fail "expected the hotfix warning, got: $(cat "$repo.out")"
}

test_runs_ci_local_when_there_is_no_stamp
test_blocks_when_ci_local_fails
test_skips_ci_local_when_the_stamp_matches
test_reruns_ci_local_for_a_stale_stamp
test_blocks_a_dirty_tree
test_blocks_pushing_a_commit_other_than_head
test_allows_deleting_a_remote_branch
test_allows_pushing_a_tag
test_skip_env_var_pushes_without_running_checks

echo "pre-push tests passed"
