---
name: commit
description: 'Create Waitkit Git commits: inspect changes, split logical units, stage precisely, and commit with Conventional Commit messages. Use only when the user explicitly asks to commit.'
allowed-tools: Bash(git *:*), Bash(bash *discover-changed-areas.sh:*), Read
---

# Waitkit commit

Use only when the user asks to create commits. For message suggestions alone, answer without
running `git add` or `git commit`.

1. Inspect: `git status --short`, `git diff --stat`, `git diff --staged --stat`. If the user asks
   to commit what is staged, the staged diff is the source of truth.
2. Find scopes: `bash "${CLAUDE_SKILL_DIR}/scripts/discover-changed-areas.sh" auto`, then read
   `${CLAUDE_SKILL_DIR}/references/scope-guide.md`.
3. Split into logical units: package source with its tests, docs, changesets and release
   metadata, tooling, CI, harness. Files from one requested change stay together.
4. For each unit: `git add <files>`, `git commit -m "<type>(<scope>): <description>"`, then
   `git log --oneline -n 3`.

Rules: never push; never commit `dist/`, `.turbo/`, or `.claude/command.log`; leave unrelated
user changes unstaged and mention them.
