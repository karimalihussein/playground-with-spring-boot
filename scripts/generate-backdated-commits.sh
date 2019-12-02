#!/usr/bin/env bash
#
# Creates new commits with historical author/committer dates (2017–2019).
# Safe: does not rebase, amend, or modify existing history—only appends commits.
# Run from the root of a Git repository (or set REPO_ROOT).
#
# Usage: ./scripts/generate-backdated-commits.sh
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
if [[ -z "$REPO_ROOT" ]] || ! git -C "$REPO_ROOT" rev-parse --git-dir &>/dev/null; then
	echo "error: not inside a git repository. Clone or run: git init" >&2
	exit 1
fi
cd "$REPO_ROOT"

LOG_FILE="log.txt"
touch "$LOG_FILE"

# commit_with_date "ISO-8601" "commit message" "one line to append to log"
commit_with_date() {
	local iso="$1"
	local msg="$2"
	local line="$3"
	printf '%s\n' "$line" >>"$LOG_FILE"
	git add -- "$LOG_FILE"
	# Set both so author and committer timestamps match (git log --pretty=fuller).
	GIT_AUTHOR_DATE="$iso" GIT_COMMITTER_DATE="$iso" \
		git commit -m "$msg"
}

# --- 2017 (chronological) ---
commit_with_date "2017-03-12T10:15:00" "2017: initial activity log" "[2017-03-12] project notes started"
commit_with_date "2017-09-28T16:40:00" "2017: mid-year log entry" "[2017-09-28] mid-year update"

# --- 2018 ---
commit_with_date "2018-01-20T09:00:00" "2018: new year log line" "[2018-01-20] new year checkpoint"
commit_with_date "2018-07-04T14:30:00" "2018: summer maintenance note" "[2018-07-04] summer review"

# --- 2019 ---
commit_with_date "2019-04-10T11:20:00" "2019: spring log entry" "[2019-04-10] spring iteration"
commit_with_date "2019-10-15T18:05:00" "2019: autumn closeout" "[2019-10-15] year-end style wrap-up"

echo ""
echo "Done. Last commits (newest first):"
git --no-pager log -6 --oneline

echo ""
echo "=== git log --pretty=fuller (new commits only, last 6) ==="
git --no-pager log -6 --pretty=fuller
