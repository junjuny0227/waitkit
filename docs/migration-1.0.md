# Migrating to Waitkit 1.0

1.0 is a redesign. Every package depends on one shared engine in `@waitkit/core`, options are
grouped by effect, and string URL matching is exact instead of substring. Most changes are
renames. `setupWaitKit` and `waitkit validate` report every removed option together with its
replacement, so the quickest path is:

1. Update all `@waitkit/*` packages to `^1.0.0` together.
2. Run `npx waitkit validate` (or start the app) and fix the reported paths.
3. Check string `url` matchers (see [URL matching](#url-matching)); this is the one change that
   can silently stop a rule from matching.

Node.js 22.18 or newer is required for the CLI and for running tests in Node.

## Rules

| 0.x                                               | 1.0                                    |
| ------------------------------------------------- | -------------------------------------- |
| `errorRate: 1, errorResponse: { status: 503 }`    | `error: { status: 503 }`               |
| `errorRate: 0.3`                                  | `error: { rate: 0.3 }`                 |
| `errorResponse: { statusText, headers, body }`    | `error: { statusText, headers, body }` |
| `timeoutRate: 1, timeoutMs: 3000`                 | `timeout: { ms: 3000 }`                |
| `timeoutRate: 0.5`                                | `timeout: { rate: 0.5 }`               |
| `errorResponse` without `errorRate` (did nothing) | `error: { ... }` (now always triggers) |

`rate` now defaults to 1, so writing an effect is enough to trigger it. Effects still run in the
order delay, timeout, error.

## URL matching

String matchers used to match anywhere in the URL (`url.includes(pattern)`). They are now path
patterns matched against the whole pathname:

| Rule `url`       | 0.x matched                                     | 1.0 matches                        |
| ---------------- | ----------------------------------------------- | ---------------------------------- |
| `'/api/users'`   | `/api/users`, `/api/users/42`, `/api/users-old` | `/api/users`, `/api/users/`        |
| `'/api/users/*'` | —                                               | `/api/users/42`, `/api/users/42/x` |
| `'/api/*'`       | (literal `*`)                                   | everything under `/api/`           |
| `'/users/:id'`   | (literal `:id`)                                 | `/users/42`, not `/users/42/posts` |

To keep the old behavior for a rule, use a function: `url: (url) => url.href.includes('/api/users')`.
RegExp matchers now run against the absolute URL (`http://host/api/users?x=1`) instead of the
string passed to `fetch`; anchored patterns like `/^\/api/` should become `/\/api/` or a path
pattern.

## Setup and config

| 0.x                                                                                 | 1.0                                                                                                  |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `setupWaitKit({ rules, scenarios, ... })`                                           | `setupWaitKit(config, options)`                                                                      |
| `activeScenario` (core) / `defaultScenario` (CLI)                                   | `scenario` in the config                                                                             |
| `enabled`, `debug` in the same object                                               | `options.enabled`, `options.debug`                                                                   |
| `onRequest`, `onMatch`, `onDelayStart`, `onDelayEnd`, `onError`, `onScenarioChange` | `controller.on('request' \| 'match' \| 'delayStart' \| 'delayEnd' \| 'error' \| 'change', listener)` |
| `import { defineConfig } from '@waitkit/cli'`                                       | `import { defineConfig } from '@waitkit/core'`                                                       |
| `validateDelay`, `validateRate`, `validateTimeoutMs`                                | `validateConfig(config)` / `validateEffects(effects)`                                                |
| `resolveDelay`, `shouldTrigger`                                                     | `resolveOutcome(effects, { random })`                                                                |
| Invalid config throws on the first problem                                          | `WaitKitConfigError` with every issue in `issues`                                                    |

```ts
// 0.x
const controller = setupWaitKit({
  enabled: import.meta.env.DEV,
  activeScenario: 'slow',
  scenarios: { slow: [{ url: '/api', delay: 1000 }] },
  onMatch: (event) => console.log(event.url),
});

// 1.0
const controller = setupWaitKit(
  { scenario: 'slow', scenarios: { slow: [{ url: '/api/*', delay: 1000 }] } },
  { enabled: import.meta.env.DEV },
);
controller.on('match', (event) => console.log(event.url));
```

## Controller

| 0.x                                     | 1.0                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `isEnabled()`                           | `getState().enabled`                                                                                |
| `getScenario()`                         | `getState().scenario`                                                                               |
| `getScenarioNames()`                    | `scenarios`                                                                                         |
| `addEventListener(type, fn)`            | `on(type, fn)`                                                                                      |
| `scenarioChange` event                  | `change` event with `previous`, `current`, and `reason`; also fired by enable, disable, and dispose |
| `restore()`, then `enable()` re-patches | `dispose()`; a disposed controller throws on `enable()`. Call `setupWaitKit` again instead.         |

## Events

- `url` is now the absolute URL, and `method` is always upper case.
- `match`, `delayStart`, `delayEnd`, and `error` carry `outcome` (`{ kind, delayMs, ... }`)
  instead of a top-level `delayMs`.

## Behavior changes

- **Abort**: aborting a request during a simulated delay or timeout now rejects at once with the
  signal's reason. 0.x ignored the signal.
- **Setting up twice** disposes the previous controller instead of stacking a second patch, which
  makes hot module reload safe.

## `@waitkit/react`

| 0.x                                                           | 1.0                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `<WaitKitProvider scenarioNames={...}>`                       | `<WaitKitProvider controller={...}>` (names come from the controller)             |
| `useWaitKitScenario()`                                        | `useWaitKit()` (`scenario`, `scenarios`, `setScenario`, `resetScenario`)          |
| `useWaitKit().restore`                                        | removed; call `controller.dispose()`                                              |
| `useWaitKit().scenarioNames`                                  | `useWaitKit().scenarios`                                                          |
| —                                                             | `useWaitKitEvent(type, listener)`, `useWaitKitController()`                       |
| DevTools buttons `Enabled` / `Disabled` / `Restore` / `reset` | `Simulate` switch / scenario chips with `base`; the panel collapses to a launcher |

`useWaitKit` now follows changes made directly on the controller.

## `@waitkit/msw`

| 0.x                                                                                  | 1.0                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `withWaitKit({ errorRate, errorResponse, timeoutRate, timeoutMs, delay }, resolver)` | `withWaitKit({ delay, timeout, error }, resolver, { random })` |
| `WaitKitMswRule`                                                                     | `WaitKitEffects` (re-exported)                                 |
| Invalid options were not checked                                                     | `WaitKitConfigError` when the handler is created               |

MSW 3 is supported alongside MSW 2.

## `@waitkit/cli`

- The binary is ESM and needs Node.js 22.18+.
- `defineConfig` and `WaitKitConfig` moved to `@waitkit/core`; the CLI package no longer exports
  a library API.
- `validate` prints every issue with its path; `list` prints each rule's effects.
- New options: `-c, --config <path>`, `-C, --cwd <dir>`, and `init --file <path>`.
- `.cts` and `.cjs` config files are found as well.

## License

Waitkit 1.0 is released under the Apache License 2.0. 0.x releases remain under MIT.
