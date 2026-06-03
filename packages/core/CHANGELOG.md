# @waitkit/core

## 0.5.0

### Minor Changes

- a71c233: Export validation helpers from `@waitkit/core` and introduce `@waitkit/cli`.

  `@waitkit/core`: `validateDelay`, `validateRate`, and `validateTimeoutMs` are now part of the public API. These were previously internal utilities.

  `@waitkit/cli`: new package providing a `waitkit` binary with three commands — `init` (scaffold a `waitkit.config.ts` template), `list` (print scenarios from the config file), and `validate` (check every rule in the config file). Also exports the `defineConfig` helper and the `WaitKitConfig` type. TypeScript config files are loaded at runtime via `jiti`.

## 0.4.0

### Minor Changes

- 25c8875: Added `delayStart` and `delayEnd` event types to `WaitKitEventMap`, enabling subscription via `addEventListener`.

  Added `getScenarioNames(): readonly string[]` to `WaitKitController`. Returns the list of scenario names passed to `setupWaitKit`.

  Exported `resolveDelay`, `sleep`, and `shouldTrigger` as part of the public API.

  Added JSDoc to `UrlMatcher` documenting that string matchers use substring matching.

## 0.3.0

### Minor Changes

- 574c944: Add `addEventListener` to `WaitKitController` for dynamic event subscription.

  Returns an unsubscribe function. Supported event types: `request`, `match`, `error`, `scenarioChange`.

  Also adds `WaitKitEventMap`, `WaitKitEventType`, and `WaitKitEventListener` types to the public API.

## 0.2.0

### Minor Changes

- Add scenario change events and document the finalized P1 core behavior, including rule matching, timeout/error semantics, response simulation handling, and event payloads.

## 0.1.1

### Patch Changes

- Update README documentation for package overview and usage.

## 0.1.0

### Minor Changes

- Initial release of @waitkit/core with development-only fetch interception, delay, error, timeout, scenario, and controller APIs.
