---
description: 'Root-cause debugging, boundary tracing, and fix discipline rules for Waitkit bugs, validation failures, package output issues, and scripts.'
paths:
  - 'packages/**/*'
  - '.claude/**/*.sh'
  - '.claude/skills/systematic-debugging/**/*'
---

# Debugging Rules

Use these rules for bugs, test failures, build failures, publish failures, and
unexpected behavior.

## Root Cause First

Do not patch symptoms before identifying the likely root cause.

Before changing code:

1. Read the full error output.
2. Reproduce the issue or identify why it cannot be reproduced.
3. Check recent diffs and relevant call sites.
4. Compare the broken path with a working local pattern.
5. State one specific hypothesis before editing.

## Boundary Tracing

For core behavior issues, trace:

```text
setup options -> active rules/scenario -> matcher -> simulated effect -> fetch/Response -> controller state
```

For package output issues, trace:

```text
source export -> tsup entry -> dist output -> package exports -> consumer import
```

For release issues, trace:

```text
changeset -> version/changelog -> package metadata -> build -> npm publish output
```

## Fix Discipline

- Make one root-cause fix at a time.
- Do not bundle cleanup with a bug fix.
- If two fix attempts fail, stop and re-evaluate the hypothesis.
- If the failure depends on npm auth, registry state, or environment, separate
  environment evidence from code evidence.
