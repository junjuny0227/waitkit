# @waitkit/core

Development-only network simulation for `fetch`. Matching requests are delayed, answered with a
simulated error response, or left hanging until they time out, so loading, error, timeout, and
retry states can be tested on purpose.

```sh
npm install -D @waitkit/core
```

## Quick start

```ts
// waitkit.config.ts
import { defineConfig } from '@waitkit/core';

export default defineConfig({
  rules: [{ url: '/api/*', delay: [200, 600] }],
  scenarios: {
    'server-error': [{ url: '/api/*', error: { status: 500, body: { message: 'Boom' } } }],
    flaky: [{ url: '/api/orders', method: 'POST', error: { rate: 0.3, status: 503 } }],
    timeout: [{ url: '/api/*', timeout: { ms: 5000 } }],
  },
});
```

```ts
// main.ts
import { setupWaitKit } from '@waitkit/core';

import config from './waitkit.config';

export const waitkit = setupWaitKit(config, { enabled: import.meta.env.DEV });
```

Waitkit is a development tool. Gate it on your environment, or import it dynamically so it is
not part of production bundles:

```ts
if (import.meta.env.DEV) {
  const [{ setupWaitKit }, { default: config }] = await Promise.all([
    import('@waitkit/core'),
    import('./waitkit.config'),
  ]);
  setupWaitKit(config);
}
```

## Rules

```ts
interface WaitKitRule {
  url: string | RegExp | ((url: URL) => boolean);
  method?: HttpMethod | HttpMethod[];
  delay?: number | [min: number, max: number];
  timeout?: { rate?: number; ms?: number };
  error?: {
    rate?: number;
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
    body?: unknown;
  };
}
```

- **The first matching rule wins.** Put specific rules before broad ones.
- **`url` as a string is a path pattern** matched against the whole pathname. `:name` matches one
  segment, `*` matches the rest, the query string is ignored, and a trailing slash is optional.
  `'/api/users'` does not match `/api/users/42`; use `'/api/users/*'` for that. A pattern with a
  scheme (`'https://api.example.com/*'`) also matches the origin.
- **`url` as a RegExp** is tested against the absolute URL. **As a function** it receives the
  parsed `URL`.
- **Effects run in order: `delay`, then `timeout`, then `error`.** A request can be delayed and
  then fail.
- **`rate` defaults to 1.** `error: { status: 503 }` always fails; `error: { rate: 0.1 }` fails
  one request in ten. `timeout.ms` defaults to 30 000 and `error.status` to 500.
- **Error bodies**: plain objects and arrays are sent as JSON with
  `content-type: application/json` unless you set one. Strings, `Blob`, `ArrayBuffer`, typed
  arrays, `FormData`, and `URLSearchParams` are sent as-is.
- **Timeouts** wait `ms` and then reject with `WaitKitTimeoutError`.
- **Aborting** a request (`AbortController`) while it is delayed or hanging rejects it at once
  with the signal's reason, like a real `fetch`.

## Scenarios

`rules` apply while no scenario is active. Activating a scenario replaces them with that
scenario's rules; the two are never merged.

```ts
waitkit.setScenario('server-error');
waitkit.resetScenario(); // back to `rules`
waitkit.scenarios; // ['server-error', 'flaky', 'timeout']
```

## Controller

| Member                   | Description                                                                   |
| ------------------------ | ----------------------------------------------------------------------------- |
| `getState()`             | `{ enabled, scenario, disposed }`. Returns the same object until it changes.  |
| `enable()` / `disable()` | Pause or resume simulation. While disabled every request goes to the network. |
| `setScenario(name)`      | Activate a scenario. Throws for an unknown name.                              |
| `resetScenario()`        | Go back to the base `rules`.                                                  |
| `scenarios`              | Scenario names in declaration order.                                          |
| `on(type, listener)`     | Subscribe to an event. Returns an unsubscribe function.                       |
| `dispose()`              | Restore the original `fetch`. A disposed controller cannot be re-enabled.     |

Only one controller is active at a time. Calling `setupWaitKit` again, for example after a hot
module reload, disposes the previous controller first.

### Events

| Event        | When                                                                |
| ------------ | ------------------------------------------------------------------- |
| `request`    | Every request while enabled, matched or not                         |
| `match`      | A rule matched; `event.outcome` says what will happen               |
| `delayStart` | Before a delay                                                      |
| `delayEnd`   | After a delay                                                       |
| `error`      | Before a timeout starts waiting or a simulated error is returned    |
| `change`     | `enabled`, `scenario`, or `disposed` changed (`previous`/`current`) |

## Options

```ts
setupWaitKit(config, {
  enabled: true, // start enabled (default)
  random: Math.random, // replace for deterministic tests
  debug: false, // log simulated requests with console.info
});
```

Pass a fixed `random` in tests to make delay ranges and rates deterministic:

```ts
setupWaitKit(config, { random: () => 0 }); // every rate above 0 triggers, ranges use their min
```

## Validation

`setupWaitKit` validates the config and throws a `WaitKitConfigError` that lists every problem
with its path, such as `scenarios.flaky[0].error.rate: must be a number between 0 and 1`.
Options removed in 1.0 are reported with their replacement. `validateConfig(config)` returns
the issues without throwing, and `isWaitKitConfig(value)` is its type-guard form.

## Building your own adapter

The decision and its execution are exported separately, so a new transport behaves exactly like
`fetch`:

```ts
import { applyOutcome, resolveOutcome } from '@waitkit/core';

const outcome = resolveOutcome(rule); // { kind: 'passthrough' | 'error' | 'timeout', delayMs, ... }
const result = await applyOutcome(outcome, {
  request: { method, url },
  signal,
  passthrough: () => sendForReal(),
});
```

## License

Apache-2.0
