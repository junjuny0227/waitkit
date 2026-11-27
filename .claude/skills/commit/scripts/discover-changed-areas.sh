#!/usr/bin/env bash
# Prints the commit scopes touched by the current changes, one per line.

set -euo pipefail

MODE="${1:-auto}"

case "$MODE" in
  staged) FILES=$(git diff --staged --name-only --diff-filter=ACMRD) ;;
  unstaged) FILES=$(git diff --name-only --diff-filter=ACMRD) ;;
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
  /^packages\/[a-z]+\/README\.md$/ { print "docs"; next }
  /^packages\/[a-z]+\/CHANGELOG\.md$/ { print "release"; next }
  /^packages\/core\// { print "core"; next }
  /^packages\/react\// { print "react"; next }
  /^packages\/msw\// { print "msw"; next }
  /^packages\/cli\// { print "cli"; next }
  /^packages\/typescript-config\// { print "tooling"; next }
  /^apps\/example\// { print "example"; next }
  /^\.changeset\// { print "release"; next }
  /^(AGENTS|CLAUDE)\.md$/ { print "harness"; next }
  /^\.claude\// { print "harness"; next }
  /^ROADMAP\.md$/ { print "roadmap"; next }
  /^(README\.md|docs\/)/ { print "docs"; next }
  /^\.github\// { print "ci"; next }
  /^(LICENSE|NOTICE|\.gitignore)$/ { print "tooling"; next }
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|\.ox(fmt|lint)rc\.json|\.vscode\/)/ { print "tooling"; next }
  { print "global" }
' | sort -u
