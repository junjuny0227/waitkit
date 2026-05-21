#!/usr/bin/env bash

set -euo pipefail

PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null || true)
if [ -z "$PR_NUMBER" ]; then
  echo "ERROR: No open PR found for current branch." >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
BASE=$(gh pr view "$PR_NUMBER" --json baseRefName -q .baseRefName)

mkdir -p .pr-tmp

gh api "repos/$REPO/pulls/$PR_NUMBER/comments" \
  --jq '[.[] | {id, path, line, body, user: .user.login}]' \
  > .pr-tmp/pr_comments.json

gh pr view "$PR_NUMBER" \
  --json commits \
  --jq '.commits[] | "\(.oid) \(.abbreviatedOid) \(.messageHeadline)"' \
  > .pr-tmp/pr_commits.txt
gh pr view "$PR_NUMBER" --json files --jq '.files[].path' > .pr-tmp/pr_changed_files.txt
gh pr diff "$PR_NUMBER" > .pr-tmp/pr_diff.txt

{
  echo "PR_NUMBER=$PR_NUMBER"
  echo "REPO=$REPO"
  echo "BASE=$BASE"
} > .pr-tmp/pr_meta.env

echo "PR #$PR_NUMBER | Repo: $REPO | Base: $BASE"
echo "Comments: $(jq length .pr-tmp/pr_comments.json), Changed files: $(wc -l < .pr-tmp/pr_changed_files.txt | tr -d ' ')"
