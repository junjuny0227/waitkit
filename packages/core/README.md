# @waitkit/core

Development-only fetch interceptor for intentionally testing loading, skeleton,
error, timeout, and retry states.

`@waitkit/core` patches `globalThis.fetch` and applies rules or named scenarios
to matching requests. It is intended for local development and UI state testing,
not for production network control.

## Installation

Install it as a development dependency if you only load Waitkit in development:

```bash
npm install -D @waitkit/core
# or
pnpm add -D @waitkit/core
# or
yarn add -D @waitkit/core
# or
bun add -d @waitkit/core
```

If your production source imports `@waitkit/core` directly, install it as a
regular dependency instead:

```bash
npm install @waitkit/core
# or
pnpm add @waitkit/core
# or
yarn add @waitkit/core
# or
bun add @waitkit/core
```

A common pattern is to load it only in development:

```ts
if (import.meta.env.DEV) {
  const { setupWaitKit } = await import('@waitkit/core');

  setupWaitKit({
    rules: [{ url: '/api/users', delay: 1000 }],
  });
}
```

## Basic Usage

```ts
import { setupWaitKit } from '@waitkit/core';

const waitkit = setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/users', method: 'GET', delay: 1200 }],
});

waitkit.restore();
```

## Scenarios

Use scenarios when you want to switch between named network states while
developing a screen.

```ts
import { setupWaitKit } from '@waitkit/core';

const waitkit = setupWaitKit({
  enabled: import.meta.env.DEV,
  activeScenario: 'slow-network',
  scenarios: {
    'slow-network': [{ url: '/api/users', method: 'GET', delay: [800, 2000] }],
    'server-error': [
      {
        url: '/api/payment',
        method: 'POST',
        delay: 500,
        errorRate: 1,
        errorResponse: {
          status: 500,
          body: { message: 'Payment failed' },
        },
      },
    ],
    timeout: [{ url: '/api/report', timeoutRate: 1, timeoutMs: 5000 }],
  },
});

waitkit.setScenario('server-error');
waitkit.resetScenario();
waitkit.restore();
```

## Error Responses

Object bodies are serialized as JSON and receive `content-type:
application/json` when no content type is already provided.
When `statusText` is omitted, Waitkit uses the runtime `Response` default for
the configured status.

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [
    {
      url: '/api/login',
      method: 'POST',
      errorRate: 1,
      errorResponse: {
        status: 401,
        body: { message: 'Invalid credentials' },
      },
    },
  ],
});
```

## Timeouts

Timeout rules throw a `WaitKitTimeoutError`. If a rule also has `delay`,
Waitkit waits for the delay first and then waits for `timeoutMs`, so the total
simulated wait can be `delay + timeoutMs`.

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/report', timeoutRate: 1, timeoutMs: 5000 }],
});
```

Waitkit does not currently cancel simulated delay or timeout sleeps when a
request `AbortSignal` aborts.

## Controller API

`setupWaitKit` returns a controller:

- `enable()`: Enables rule matching.
- `disable()`: Bypasses all rules and calls the original `fetch`.
- `restore()`: Restores the original `fetch`.
- `isEnabled()`: Returns whether rule matching is enabled.
- `setScenario(name)`: Uses a named scenario.
- `getScenario()`: Returns the active scenario name.
- `resetScenario()`: Clears the active scenario and falls back to `rules`.
- `addEventListener(type, listener)`: Subscribes to an event. Returns an unsubscribe function.

```ts
const controller = setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/users', delay: 1000 }],
});

const unsubscribe = controller.addEventListener('match', (event) => {
  console.log(event.url, event.delayMs);
});

// later
unsubscribe();
```

Supported event types: `request`, `match`, `error`, `scenarioChange`.
`addEventListener` is an alternative to the inline `onXxx` options and is useful when you need to attach or detach listeners dynamically at runtime.

## Rule Options

- `url`: `string`, `RegExp`, or `(url: string) => boolean`.
- `method`: HTTP method or method array.
- `delay`: Fixed milliseconds or `[min, max]` random range.
- `errorRate`: Probability from `0` to `1` for returning an error response.
- `errorResponse`: Simulated response status, headers, status text, and body.
- `timeoutRate`: Probability from `0` to `1` for throwing a timeout error.
- `timeoutMs`: Time to wait before throwing the timeout error.

The first matching rule is applied.

## Rule Matching

String, `RegExp`, and predicate URL matchers receive the request's full URL
string, including any query string. Use a predicate matcher if you want to
match only part of the URL.

```ts
setupWaitKit({
  rules: [
    {
      url: (url) => new URL(url, window.location.origin).pathname === '/api/users',
      delay: 1000,
    },
  ],
});
```

When multiple rules match a request, the first matching rule in the array wins.

## Events

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/users', delay: 1000 }],
  onRequest: (event) => console.log(event.url),
  onMatch: (event) => console.log(event.rule),
  onDelayStart: (event) => console.log(event.delayMs),
  onDelayEnd: (event) => console.log(event.delayMs),
  onError: (event) => console.error(event.error),
  onScenarioChange: (event) => console.log(event.scenario),
});
```

Event payloads include the original `input` and `init`, normalized `url` and
`method`, and match events also include the matched `rule`, active `scenario`
name, and resolved `delayMs`. `onError` additionally receives the simulated
`error`.

The request lifecycle event names are stable: `onRequest`, `onMatch`,
`onDelayStart`, `onDelayEnd`, and `onError`.

`onScenarioChange` runs when `setScenario()` or `resetScenario()` changes the
active scenario. It does not run for the initial `activeScenario` value passed
to `setupWaitKit`, setting the same scenario again, or resetting when no
scenario is active. Its payload includes `previousScenario`, `scenario`, and
`reason` (`setScenario` or `resetScenario`).

## Production Safety

Waitkit does not force development-only usage. Gate it explicitly with your
environment flag:

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/users', delay: 1000 }],
});
```
