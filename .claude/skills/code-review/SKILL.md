---
name: code-review
description: 'Review a Waitkit diff against AGENTS.md and .claude/rules: package boundaries, the core behavior contract, tests, docs, and release notes. Findings first.'
---

# Waitkit code review

## Scope

- Staged: `git diff --staged`. Working tree: `git diff`. Branch: `git diff origin/main...HEAD`.
- Read `AGENTS.md` and the `.claude/rules/*.md` files whose `paths` match the diff. When they
  conflict: `AGENTS.md` > `CLAUDE.md` > `.claude/rules` > nearby code.

## What to look for, in priority order

1. **Behavior contract** (`core-api-conventions.md`): defaults, effect order, matching, abort,
   `dispose`, state identity, event emission. Any change here is breaking unless additive.
2. **Boundaries** (`package-architecture.md`): logic copied out of core into an adapter, runtime
   imports added to core, MSW imported for values instead of types.
3. **Tests**: each behavior change has a focused test; randomness uses the `random` option;
   timers are faked; fetch is restored.
4. **Public surface**: `src/index.ts` exports, explicit return types, README examples that
   compile, migration guide rows for breaking changes, changeset bump level.
5. **Global state and leaks**: listeners removed, timers cleared on abort, no secrets or
   generated files committed.

## Report

```markdown
## Findings

- [High|Medium|Low] `path:line` — problem, impact, suggested fix.

## Open questions

- Only real blockers or assumptions.

## Checks

- Commands run and their results; what was not run.
```

If there are no findings, say so and name the remaining test gaps.
