---
name: library-architecture
description: 'Plan and review Waitkit library architecture, package boundaries, public exports, TypeScript/tsup output, package metadata, and release impact. Use for API design, package refactors, new package planning, and architecture decisions.'
---

# Waitkit Library Architecture

Use this skill to keep Waitkit changes small, framework-agnostic, and safe for
published packages.

## Repository Shape

- `packages/core`: current publishable package.
- `packages/core/src/index.ts`: public API surface.
- `packages/core/src/*.ts`: internal implementation modules.
- `packages/core/tests`: Vitest coverage.
- `packages/eslint-config` and `packages/typescript-config`: shared tooling.

## Decision Rules

- Keep `@waitkit/core` independent from React, MSW, and CLI concerns.
- Add public exports only when they are intended for consumers.
- Treat exported types, package `exports`, README examples, and tests as one
  contract.
- Prefer explicit TypeScript types over inferred public API accidents.
- Avoid broad refactors unless they reduce current complexity or protect a
  public contract.

## Planning Output

For non-trivial changes, produce a short plan with API impact, package boundary
impact, files likely to change, tests, and release notes or changeset needs.
