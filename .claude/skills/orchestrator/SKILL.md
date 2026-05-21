---
name: orchestrator
description: 'Coordinate the Waitkit library harness for core implementation, package architecture, tests, debugging, QA, code review, docs, Changesets, releases, commits, PR creation, and PR review replies. Use for Waitkit implementation tasks, reviews, reruns, updates, revisions, follow-up fixes, and Git workflow tasks.'
---

# Waitkit Orchestrator

Coordinate the Waitkit harness. Route work to focused specialists and keep
changes small, verifiable, and aligned with the repository.

## Execution Mode

Use only the agents needed for the task.

| Agent                          | Role                                 | Skill                               |
| ------------------------------ | ------------------------------------ | ----------------------------------- |
| `library-architect`            | Package/API planning                 | `library-architecture`              |
| `core-implementation-engineer` | Core TypeScript implementation       | `core-implementation`               |
| `release-docs-assistant`       | README, Changesets, release notes    | `release-docs`                      |
| `qa-inspector`                 | Validation and boundary checks       | `quality-gate`                      |
| `code-reviewer`                | Changed-file review                  | `code-review`                       |
| `bug-investigator`             | Root-cause debugging                 | `systematic-debugging`              |
| `git-workflow-assistant`       | Commits, PRs, review comment replies | `commit` / `write-pr` / `review-pr` |

## Context Check

Before starting work, read `CLAUDE.md`, `AGENTS.md`, root `package.json`, the
affected package manifest, relevant `.claude/rules/*.md`, and directly related
source/tests/docs.

## Task Classification

- Public API, exports, package config, or new package planning:
  `library-architect`.
- `packages/core/src` behavior or tests: `core-implementation-engineer`.
- README, ROADMAP, Changesets, changelogs, package metadata, release prep:
  `release-docs-assistant`.
- Bugs, failed commands, build/test/lint failures: `bug-investigator` first.
- Review requests or pre-PR review: `code-reviewer`.
- Final acceptance and validation: `qa-inspector`.
- Branch, commit, PR, or review-comment workflow: `git-workflow-assistant`.

For small tasks, call only one specialist. For package behavior changes, use a
producer plus QA/review flow.

## Quality Gate

Before final delivery, run or request:

```bash
pnpm exec prettier --check .
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

If a command cannot run, explain the blocker and list completed static checks.

## Side Effects

Do not commit, push, create PRs, reply to GitHub comments, or publish npm
packages unless the user explicitly asks for that side effect.
