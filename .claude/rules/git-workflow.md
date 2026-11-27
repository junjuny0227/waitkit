---
description: 'Branch, commit, PR, and review-reply conventions for Waitkit.'
paths:
  - '.github/**/*'
  - '.changeset/**/*'
  - '.claude/skills/commit/**/*'
  - '.claude/skills/write-pr/**/*'
  - '.claude/skills/review-pr/**/*'
---

# Git workflow

- Branch: `<type>/<kebab-case>`; types `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`.
- Commit: `<type>(<scope>): <description>` in English. Scopes: `core`, `react`, `msw`, `cli`,
  `example`, `docs`, `release`, `tooling`, `ci`, `harness`.
- One logical change per commit. Keep source, formatting churn, release metadata, and harness
  edits in separate commits unless one request needs them together.
- PR title and body in Korean, following `.github/PULL_REQUEST_TEMPLATE.md`: purpose, changes,
  the gate commands actually run, release impact, and whether a changeset was added.
- Review replies in Korean. Reply to every review comment, including the ones not applied, with
  the reason.
- No commit, push, PR, review reply, or publish without an explicit request for that step.
