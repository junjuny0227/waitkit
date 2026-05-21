# Waitkit

## Project Overview

Waitkit is a pnpm/Turborepo monorepo for development-only network simulation
tools. It helps frontend developers intentionally test loading, skeleton, error,
timeout, and retry states.

## Tech Stack

- Package manager: pnpm
- Build system: Turborepo
- Language: TypeScript
- Core package build: tsup
- Tests: Vitest
- Lint/format: ESLint and Prettier
- Release: Changesets

## Project Structure

- `packages/core`: publishable `@waitkit/core` package.
- `packages/core/src`: fetch interception, rule matching, response simulation,
  delay, errors, controller API, and public exports.
- `packages/core/tests`: Vitest coverage for core behavior.
- `packages/eslint-config`: shared ESLint config.
- `packages/typescript-config`: shared TypeScript config.
- `.changeset`: pending release notes.
- `ROADMAP.md`: future development plan.

Generated `dist/` output should not be edited directly.

## Commands

- `pnpm lint`: run ESLint through Turbo.
- `pnpm check-types`: run TypeScript checks.
- `pnpm test`: run Vitest tests.
- `pnpm build`: build packages.
- `pnpm exec prettier --check .`: check formatting.
- `pnpm changeset`: create a release note.
- `pnpm changeset:version`: apply changesets to versions/changelogs.
- `pnpm release`: build and publish changed packages.

## Harness: Waitkit Library

**Goal:** Coordinate focused Waitkit library work through reusable agents,
skills, and rules for package architecture, core implementation, debugging,
quality gates, code review, documentation, release workflow, commits, and PRs.

**Trigger:** For Waitkit implementation, API design, core package changes,
tests, debugging, release notes, Changesets, README/docs, package metadata,
branch, commit, PR creation, PR review comments, QA, rerun, revision, or
previous-result improvement requests, use the `orchestrator` skill. Simple
one-off questions may be answered directly.

Detailed harness changes are tracked in `.claude/CHANGELOG.md`.
