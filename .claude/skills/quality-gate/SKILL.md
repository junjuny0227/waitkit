---
name: quality-gate
description: 'Run the Waitkit gate (format, lint, types, build with publint/attw, tests) and report results honestly. Use before saying any change is done.'
allowed-tools: Bash(pnpm check), Bash(pnpm format*), Bash(pnpm lint*), Bash(pnpm check-types), Bash(pnpm build), Bash(pnpm test), Bash(pnpm --filter *), Read
---

# Waitkit quality gate

## Run

```bash
export TURBO_UI=stream
pnpm check
```

`pnpm check` runs format:check → lint → check-types → build → test and stops at the first
failure. To find every failing stage at once, run them separately:

```bash
pnpm format:check; pnpm lint; pnpm check-types; pnpm build; pnpm test
```

Fix formatting with `pnpm format` and auto-fixable lint with `pnpm lint:fix`.

## Classify failures

- **Caused by the change**: fix it.
- **Stale core build** ("has no exported member" in react/msw/cli): run
  `pnpm --filter @waitkit/core build`, then retry.
- **publint error in build**: a manifest path does not match the file tsdown emitted.
- **Environment**: missing Node 22.18+, or pnpm not matching `packageManager`. Report it; do not
  work around it in code.

## Static checks the commands do not cover

- Public exports changed → package README and, if breaking, `docs/migration-*.md` updated.
- npm-visible change → changeset present with the right bump.
- No edits under `dist/` and no duplicated core logic in react, msw, or cli.

## Report

Blocking issues first, then non-blocking risks, then the commands run with their exit codes,
then anything not run and why. Never report a command as passing without having run it.
