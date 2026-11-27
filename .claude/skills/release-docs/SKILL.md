---
name: release-docs
description: 'Prepare Waitkit release material: changesets, package READMEs, migration guide rows, ROADMAP, and release readiness. Never publishes.'
---

# Waitkit release docs

Follow `.claude/rules/release-workflow.md`. This skill adds the steps.

## Changeset

1. List the packages whose npm-visible behavior or docs changed.
2. Choose the bump per package: `patch`, `minor`, or `major`.
3. Write `.changeset/<kebab-name>.md` in English: one summary sentence, then bullets a user can
   act on. `pnpm changeset status` must list the expected bumps.

## Docs

- Package README: install, minimal usage, every public option, behavior notes. Examples must
  use real exports; run `pnpm check-types` after editing code samples copied into tests or apps.
- Breaking change: add a row to `docs/migration-<major>.md` with old code, new code, and how to
  keep the old behavior if possible.
- `ROADMAP.md` (Korean): move shipped items to the completed section.

## Release readiness

`pnpm check` passes, `pnpm changeset status` shows the intended bumps, `LICENSE`/`NOTICE` copies
in each package match the root. Stop there: versioning (`pnpm changeset:version`) and publishing
(`pnpm release`) run only on the user's request.
