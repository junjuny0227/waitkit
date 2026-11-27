# @waitkit/react

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

### Patch Changes

- Updated dependencies [db0c515]
  - @waitkit/core@1.0.0

## 0.4.1

### Patch Changes

- Updated dependencies [a71c233]
  - @waitkit/core@0.5.0

## 0.4.0

### Minor Changes

- 25c8875: `WaitKitProvider` now auto-derives scenario names via `controller.getScenarioNames()` when the `scenarioNames` prop is omitted. The prop remains available as an explicit override.

  Added a Restore button to `WaitKitDevTools`. Clicking it calls `controller.restore()` to reinstate the original fetch.

### Patch Changes

- Updated dependencies [25c8875]
  - @waitkit/core@0.4.0

## 0.3.0

### Minor Changes

- 574c944: Add `WaitKitDevTools` component — a fixed floating panel for development.

  Shows current enabled/disabled state, scenario switcher, and a live log of recent matched and error requests. Accepts an optional `maxLogEntries` prop (default 20).

### Patch Changes

- Updated dependencies [574c944]
  - @waitkit/core@0.3.0

## 0.2.0

### Minor Changes

- 9bee080: Add the initial React provider and hooks package for controlling Waitkit controllers.
- Prepare the first release of @waitkit/react 0.1.0 with React provider and hook APIs for Waitkit controllers.
