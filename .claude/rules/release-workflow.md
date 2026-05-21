---
description: 'Changesets, changelog, package metadata, npm publish, README, and release workflow rules for Waitkit.'
paths:
  - '.changeset/**/*'
  - 'packages/**/CHANGELOG.md'
  - 'packages/**/package.json'
  - 'README.md'
  - 'packages/**/README.md'
  - 'ROADMAP.md'
---

# Release Workflow Rules

Use these rules for documentation and release work.

## Changesets

- Add a changeset for package behavior changes intended for npm.
- Do not add a changeset for repository-only docs unless npm docs should update.
- Use `minor` for new backwards-compatible capabilities while packages are
  pre-1.0.
- Use `patch` for fixes and small npm-visible documentation updates.

## Release Checks

Before publishing, run or request:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm exec prettier --check .
```

## Publishing

Do not publish unless the user explicitly asks. Confirm npm scope permission
issues separately from code issues.
