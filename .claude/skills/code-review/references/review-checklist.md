# Waitkit Review Checklist

Use this checklist for multi-file or pre-PR reviews.

## Package and API

- Public exports from `packages/core/src/index.ts` are intentional.
- `package.json` `exports`, `main`, `module`, and `types` point to built files.
- Type declarations are generated for both ESM and CJS consumers.
- Core remains framework-agnostic.

## Core Behavior

- Matching behavior is deterministic and documented.
- Delay, error, timeout, and scenario behavior have tests.
- `enable()`, `disable()`, and `restore()` preserve expected fetch behavior.
- Simulated `Response` behavior is close to platform behavior.

## Release and Docs

- README examples compile against real exports.
- Changesets exist for npm-visible behavior changes.
- Changelog/version changes are consistent with package behavior.
- Generated `dist/` output is not manually edited.

## Validation

- `pnpm exec prettier --check .`
- `pnpm lint`
- `pnpm check-types`
- `pnpm test`
- `pnpm build`
