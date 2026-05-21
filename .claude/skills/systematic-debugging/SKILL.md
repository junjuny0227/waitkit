---
name: systematic-debugging
description: 'Investigate Waitkit bugs, build failures, lint failures, test failures, package export issues, fetch interception regressions, Changesets problems, and npm publish failures by finding root cause before fixes.'
---

# Waitkit Systematic Debugging

Use this skill before fixing bugs or validation failures.

## Rule

Find root cause before editing code. A quick patch that only hides the symptom is
not a fix.

## Phase 1: Evidence

1. Read the full error, warning, stack trace, or user reproduction.
2. Identify whether the issue is reproducible.
3. Inspect recent diffs and directly related files.
4. Compare against a working local pattern.
5. State one root-cause hypothesis.

## Phase 2: Boundary Trace

Choose the relevant trace:

```text
Core behavior: setupWaitKit -> matcher -> rule application -> fetch/Response -> controller
Package output: package.json exports -> tsup config -> dist files -> consumer import
Release: changeset file -> version/changelog -> package metadata -> npm publish output
Build: first compiler error -> owning file -> imports/types -> recent diff
```

For failures that cross more than one boundary, read
`${CLAUDE_SKILL_DIR}/references/root-cause-tracing.md` before proposing a fix.

## Phase 3: Minimal Fix

- Change one thing that addresses the hypothesis.
- Do not bundle cleanup or refactors.
- Prefer adding a focused regression test.
- If no test is suitable, document the smallest verification command.

## Phase 4: Verification

Run the smallest meaningful check first, then the broader gate:

```bash
pnpm exec prettier --check .
pnpm lint
pnpm check-types
pnpm test
pnpm build
```
