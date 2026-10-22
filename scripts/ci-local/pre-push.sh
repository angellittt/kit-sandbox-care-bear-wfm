#!/usr/bin/env bash

# git pre-push hook (wired up in lefthook.yml): a push only goes through once
# `pnpm ci:local` has passed every pull_request check for the commit being
# pushed. If the pass stamp already matches HEAD, the push goes straight
# through. If not, this runs `pnpm ci:local` first.
#
# Production hotfixes are the one exception, see "Skipping the local CI gate"
# in the Readme:
#
#   SKIP_CI_LOCAL=1 git push
#
# git passes one line per ref on stdin: "<local ref> <local sha> <remote ref>
# <remote sha>". Lefthook forwards it (use_stdin in lefthook.yml).
#
# Written for bash 3.2 too (the default /bin/bash on macOS).

set -uo pipefail

STAMP_NAME="ci-local-pass"
ZERO_SHA="0000000000000000000000000000000000000000"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 1
cd "$ROOT" || exit 1

if [ "${SKIP_CI_LOCAL:-}" = "1" ]; then
  cat >&2 <<'MSG'
************************************************************************
  SKIP_CI_LOCAL=1: pushing WITHOUT running the local CI checks.
  This is only for production hotfixes. GitHub CI must still pass before
  the PR merges. See "Skipping the local CI gate" in the Readme.
************************************************************************
MSG
  exit 0
fi

HEAD_SHA="$(git rev-parse HEAD)"
PUSHES_COMMITS=0
while read -r local_ref local_sha remote_ref _remote_sha; do
  [ -n "${local_ref:-}" ] || continue
  # Deleting a remote branch pushes no commits.
  [ "$local_sha" = "$ZERO_SHA" ] && continue
  # Tags don't open or update a PR, so they aren't gated. An annotated tag's
  # SHA is the tag object, never HEAD, so the check below would always block it.
  case "$remote_ref" in refs/tags/*) continue ;; esac
  PUSHES_COMMITS=1
  if [ "$local_sha" != "$HEAD_SHA" ]; then
    echo "pre-push: $local_ref (${local_sha:0:12}) isn't the checked-out commit (${HEAD_SHA:0:12})." >&2
    echo "pnpm ci:local only checks HEAD. Check out $local_ref and push it from there." >&2
    exit 1
  fi
done

[ "$PUSHES_COMMITS" -eq 1 ] || exit 0

STAMP_FILE="$(git rev-parse --git-path "$STAMP_NAME")"
stamp_matches() {
  [ "$(cat "$STAMP_FILE" 2>/dev/null)" = "$HEAD_SHA" ] &&
    [ -z "$(git status --porcelain 2>/dev/null)" ]
}

if stamp_matches; then
  echo "pre-push: pnpm ci:local already passed for ${HEAD_SHA:0:12}."
  exit 0
fi

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "pre-push: the working tree has uncommitted changes, so pnpm ci:local wouldn't check what you're pushing." >&2
  echo "Commit or stash them, then push again." >&2
  exit 1
fi

echo "pre-push: no local CI pass for ${HEAD_SHA:0:12} yet. Running pnpm ci:local (takes a few minutes)."
./scripts/ci-local/ci-local.sh || exit 1
stamp_matches
