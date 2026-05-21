---
description: 'Package boundary, public export, TypeScript config, and monorepo architecture rules for Waitkit packages.'
paths:
  - 'packages/**/package.json'
  - 'packages/**/src/**/*'
  - 'packages/**/tsconfig.json'
  - 'packages/**/tsup.config.ts'
  - 'pnpm-workspace.yaml'
  - 'turbo.json'
---

# Package Architecture Rules

Use these rules for package structure and public API changes.

## Boundaries

- Keep `@waitkit/core` framework-agnostic.
- Do not introduce React, MSW, or CLI dependencies into core.
- Shared tooling belongs in `packages/eslint-config` and
  `packages/typescript-config`.
- Generated `dist/` output is build output, not source.

## Public API

- Export consumer-facing APIs from `packages/core/src/index.ts`.
- Keep package `exports`, `main`, `module`, and `types` aligned with build
  output.
- Preserve ESM/CJS compatibility unless the release plan says otherwise.
- Update README examples when exported APIs change.

## Change Scope

- Make the smallest package change that satisfies the request.
- Add abstractions only when they remove current duplication or clarify a public
  contract.
