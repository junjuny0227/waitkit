# Waitkit Git Scope Guide

Choose the smallest useful commit scope.

## Common Scopes

| Changed area                                  | Scope      |
| --------------------------------------------- | ---------- |
| `packages/core/src`, `packages/core/tests`    | `core`     |
| `packages/core/README.md`, root `README.md`   | `docs`     |
| `.changeset`, `CHANGELOG.md`, package version | `release`  |
| `packages/eslint-config`                      | `eslint`   |
| `packages/typescript-config`                  | `tsconfig` |
| `package.json`, `turbo.json`, workspace files | `tooling`  |
| `.claude/**`, `CLAUDE.md`                     | `harness`  |
| `AGENTS.md`                                   | `agents`   |
| `ROADMAP.md`                                  | `roadmap`  |

## Commit Types

- `feat`: new package behavior or public capability.
- `fix`: bug fix.
- `docs`: documentation-only change.
- `test`: test-only change.
- `refactor`: behavior-preserving code restructuring.
- `chore`: tooling, release, harness, or maintenance change.
