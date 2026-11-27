# @waitkit/core

## 1.0.0

### Major Changes

- db0c515: Waitkit 1.0. All packages now share one engine in `@waitkit/core`: rule matching, validation, and the decision of what happens to a request live there, and the fetch, MSW, React, and CLI packages only execute it.
  
  Breaking changes (see `docs/migration-1.0.md`):
  
  - Rules group effects as `error: { rate, status, statusText, headers, body }` and `timeout: { rate, ms }`; `rate` defaults to 1.
  - String `url` matchers are path patterns (`/api/users/:id`, `/api/*`) matched against the whole pathname instead of substrings.
  - `setupWaitKit(config, options)`; `scenario` replaces `activeScenario`/`defaultScenario`; `defineConfig` moved to `@waitkit/core`.
  - Events are subscribed with `controller.on(type, listener)`; the option callbacks and `addEventListener` are removed, and `scenarioChange` became `change`.
  - `controller.dispose()` replaces `restore()` and cannot be undone; `getState()` replaces `isEnabled()`/`getScenario()`.
  - Invalid configs throw `WaitKitConfigError` listing every issue, with hints for options removed in 1.0.
  - Aborting a request cancels a simulated delay or timeout. Setting up again disposes the previous controller.
  - React: `scenarioNames` prop and `useWaitKitScenario` removed; `useWaitKit` follows controller changes; new `useWaitKitEvent`. `react-dom` is now a peer dependency.
  - DevTools redesigned: shadow-root isolated panel with live wait progress, a collapsible launcher, `theme` and `shortcut` props.
  - Core: new `settle` event and a per-request `id` on request lifecycle events.
  - MSW: `withWaitKit(effects, resolver, options)` with the shared effect shape; MSW 2 and 3 supported.
  - Requires Node.js 22.18+ for the CLI and Node test environments. Licensed under Apache-2.0.

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
