# @waitkit/cli

## 0.1.0

### Minor Changes

- a71c233: Export validation helpers from `@waitkit/core` and introduce `@waitkit/cli`.

  `@waitkit/core`: `validateDelay`, `validateRate`, and `validateTimeoutMs` are now part of the public API. These were previously internal utilities.

  `@waitkit/cli`: new package providing a `waitkit` binary with three commands — `init` (scaffold a `waitkit.config.ts` template), `list` (print scenarios from the config file), and `validate` (check every rule in the config file). Also exports the `defineConfig` helper and the `WaitKitConfig` type. TypeScript config files are loaded at runtime via `jiti`.

### Patch Changes

- Updated dependencies [a71c233]
  - @waitkit/core@0.5.0
