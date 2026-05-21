---
name: code-review
description: 'Review Waitkit changed files using .claude/rules, package boundaries, public API contracts, core behavior, tests, docs, Changesets, release workflow, security basics, and validation results.'
---

# Waitkit Code Review

Use this skill for structured review of changed Waitkit code, docs, release
workflow, or harness files.

## Step 1: Load Rules

Discover rules dynamically:

```bash
find .claude/rules -name "*.md" 2>/dev/null
```

Read relevant returned files. Rules in `CLAUDE.md` and `AGENTS.md` still apply.
If rules conflict, use this priority:

```text
AGENTS.md > CLAUDE.md > .claude/rules/** > nearby source patterns
```

For multi-file reviews or pre-PR checks, also read
`${CLAUDE_SKILL_DIR}/references/review-checklist.md`.

## Step 2: Determine Review Scope

- Staged review: `git diff --staged`
- Working tree review: `git diff`
- Branch review: compare with the base branch when available
- File-specific review: inspect named files and direct dependencies

## Step 3: Review Checklist

- Package boundaries and public exports.
- Type declarations and ESM/CJS package metadata.
- Core fetch interception, matching, delay, error, timeout, and restore behavior.
- Tests for changed behavior.
- README, changelog, and changeset alignment.
- Generated output or secret leakage.
- Validation commands and unverified risk.

## Report Format

Lead with findings:

```markdown
## Findings

- [High|Medium|Low] `path:line` — issue, impact, and suggested fix.

## Open Questions

- Only include real blockers or assumptions.

## Checks

- Commands and static checks performed.
```

If no issues are found, state that clearly and mention remaining test gaps.
