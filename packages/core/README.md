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
pnpm add @waitkit/core
yarn add @waitkit/core
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

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/report', timeoutRate: 1, timeoutMs: 5000 }],
});
```

## Controller API

`setupWaitKit` returns a controller:

- `enable()`: Enables rule matching.
- `disable()`: Bypasses all rules and calls the original `fetch`.
- `restore()`: Restores the original `fetch`.
- `isEnabled()`: Returns whether rule matching is enabled.
- `setScenario(name)`: Uses a named scenario.
- `getScenario()`: Returns the active scenario name.
- `resetScenario()`: Clears the active scenario and falls back to `rules`.

## Rule Options

- `url`: `string`, `RegExp`, or `(url: string) => boolean`.
- `method`: HTTP method or method array.
- `delay`: Fixed milliseconds or `[min, max]` random range.
- `errorRate`: Probability from `0` to `1` for returning an error response.
- `errorResponse`: Simulated response status, headers, status text, and body.
- `timeoutRate`: Probability from `0` to `1` for throwing a timeout error.
- `timeoutMs`: Time to wait before throwing the timeout error.

The first matching rule is applied.

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
});
```

## Production Safety

Waitkit does not force development-only usage. Gate it explicitly with your
environment flag:

```ts
setupWaitKit({
  enabled: import.meta.env.DEV,
  rules: [{ url: '/api/users', delay: 1000 }],
});
```
