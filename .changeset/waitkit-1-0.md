---
'@waitkit/core': major
'@waitkit/react': major
'@waitkit/msw': major
'@waitkit/cli': major
---

Waitkit 1.0. All packages now share one engine in `@waitkit/core`: rule matching, validation, and the decision of what happens to a request live there, and the fetch, MSW, React, and CLI packages only execute it.

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
