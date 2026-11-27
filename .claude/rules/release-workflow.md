---
description: 'Changesets, versions, package READMEs, migration notes, and publishing for Waitkit.'
paths:
  - '.changeset/**/*'
  - 'packages/**/CHANGELOG.md'
  - 'packages/**/package.json'
  - 'packages/**/README.md'
  - 'README.md'
  - 'ROADMAP.md'
  - 'docs/**/*'
---

# Release workflow

- npm-visible change → `.changeset/<name>.md`. `patch` = fix or doc fix, `minor` = new
  backwards-compatible feature, `major` = breaking. Repo-only docs, CI, and tooling need none.
- Breaking changes also get a row in the current migration guide under `docs/`.
- `pnpm changeset:version` updates versions and changelogs, then formats them. Do not edit
  `CHANGELOG.md` or versions by hand.
- Package READMEs are the npm page: examples must use real exports and compile against the
  current API. Root `README.md` stays an overview with links.
- Publishing (`pnpm release`, `changeset publish`, `npm publish`) happens only when the user asks,
  and the pre-tool hook blocks it for agents. Check npm scope permissions separately from code
  problems if publishing fails.
