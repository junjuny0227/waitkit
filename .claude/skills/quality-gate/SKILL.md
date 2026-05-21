---
name: quality-gate
description: 'Verify Waitkit changes with Prettier checks, pnpm lint, pnpm check-types, pnpm test, pnpm build, package output review, public API checks, docs alignment, and release readiness.'
---

# Waitkit Quality Gate

Use this skill to verify changes before final delivery.

## Rule Loading

Discover and read relevant project harness rules:

```bash
find .claude/rules -name "*.md" 2>/dev/null
```

Use these files together with `CLAUDE.md`, `AGENTS.md`, and nearby source
patterns.

## Minimum Commands

Run these when feasible:

```bash
pnpm exec prettier --check .
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

If a command fails, inspect whether the failure is caused by the current change,
the environment, or pre-existing repository state.

## Static Review Checklist

- Public exports match intended API.
- Package `exports`, `main`, `module`, `types`, and built files agree.
- Core behavior has focused tests.
- Global fetch patching and restore behavior remain safe.
- README examples match real exports.
- Changesets match npm-visible behavior.
- No generated `dist/` files were edited by hand.

## Reporting Format

Report findings in this order: blocking issues, non-blocking risks, commands
run, and residual risk. If no issues are found, say so directly.
