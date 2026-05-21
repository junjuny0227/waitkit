---
description: 'Branch, commit, PR text, release-note, and change grouping conventions for Waitkit Git workflow and GitHub metadata.'
paths:
  - '.github/**/*'
  - '.changeset/**/*'
  - '.claude/skills/commit/**/*'
  - '.claude/skills/write-pr/**/*'
  - '.claude/skills/review-pr/**/*'
  - '.claude/rules/git-workflow.md'
---

# Git Workflow Rules

Use these rules for branch names, commits, PR text, release notes, and change
grouping.

## Branch Names

Use:

```text
<type>/<kebab-case-description>
```

Recommended types:

- `feat`
- `fix`
- `refactor`
- `chore`
- `docs`
- `test`
- `ci`

Examples:

- `feat/add-core-timeout-events`
- `fix/core-restore-fetch`
- `chore/setup-claude-harness`

## Commit Messages

Use short Conventional Commit-style messages:

```text
<type>: <description>
```

Add a scope only when it improves clarity:

```text
feat(core): add scenario change events
```

Keep each commit focused on one logical change. Do not mix source changes,
formatting churn, release metadata, and harness configuration unless they are
part of the same requested task.

## Pull Requests

- Describe purpose, summarize work, link related issues, and mention release
  impact.
- Include validation commands and any checks that could not be run.
- Mention changesets for npm-visible package behavior changes.
- Screenshots are usually unnecessary unless the PR adds UI or docs previews.
