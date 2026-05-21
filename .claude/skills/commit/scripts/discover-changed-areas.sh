#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-auto}"

case "$MODE" in
  staged)
    FILES=$(git diff --staged --name-only --diff-filter=ACMRD)
    ;;
  unstaged)
    FILES=$(git diff --name-only --diff-filter=ACMRD)
    ;;
  auto)
    FILES=$(git diff --staged --name-only --diff-filter=ACMRD)
    if [ -z "$FILES" ]; then
      FILES=$(git diff --name-only --diff-filter=ACMRD)
    fi
    ;;
  *)
    echo "Usage: $0 [auto|staged|unstaged]" >&2
    exit 1
    ;;
esac

if [ -z "$FILES" ]; then
  echo "none"
  exit 0
fi

printf '%s\n' "$FILES" | awk '
  /^packages\/core\/src\// { print "core"; next }
  /^packages\/core\/tests\// { print "core"; next }
  /^packages\/core\/README\.md$/ { print "docs"; next }
  /^packages\/core\/CHANGELOG\.md$/ { print "release"; next }
  /^packages\/core\/package\.json$/ { print "core"; next }
  /^packages\/eslint-config\// { print "eslint"; next }
  /^packages\/typescript-config\// { print "tsconfig"; next }
  /^\.changeset\// { print "release"; next }
  /^\.claude\// { print "harness"; next }
  /^CLAUDE\.md$/ { print "harness"; next }
  /^AGENTS\.md$/ { print "agents"; next }
  /^ROADMAP\.md$/ { print "roadmap"; next }
  /^README\.md$/ { print "docs"; next }
  /^\.github\// { print "ci"; next }
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|\.prettier|\.prettierrc|\.editorconfig)/ { print "tooling"; next }
  { print "global" }
' | sort -u
