---
name: release-docs
description: 'Maintain Waitkit README files, ROADMAP, Changesets, changelogs, package metadata, install docs, release notes, and npm publish preparation. Use for documentation or release workflow tasks.'
---

# Waitkit Release Docs

Use this skill when docs, package metadata, or release workflow may change.

## Documentation Rules

- Root README stays concise: project purpose, packages, planned packages.
- Package README explains install, usage, APIs, and production-safety guidance.
- Keep examples aligned with real exports and current TypeScript behavior.
- Prefer English for npm-facing docs unless the user asks otherwise.

## Changesets Rules

- Use `pnpm changeset` for package behavior changes that should be published.
- Use `patch` for fixes and npm-visible docs updates.
- Use `minor` for new backwards-compatible package capability before 1.0.
- Do not use `major` before the public API is intentionally stable.
- Docs-only GitHub changes do not need a changeset unless npm package docs must
  update.

## Release Preparation

Before release, verify package version, changelog, README, package exports,
build output, and npm scope permissions. Never run `pnpm release` unless the
user explicitly asks to publish.
