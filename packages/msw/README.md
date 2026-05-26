# @waitkit/msw

MSW handler wrapper for applying [Waitkit](https://github.com/junjuny0227/waitkit) delay, error, and timeout simulation.

`@waitkit/msw` wraps MSW v2 resolver functions so Waitkit rules run inside the
MSW handler pipeline — no `globalThis.fetch` patching needed.

## Requirements

- msw **v2 or later**
- @waitkit/core **v0.3 or later** (installed automatically)

## Installation

```bash
npm install -D @waitkit/msw
# or
pnpm add -D @waitkit/msw
# or
yarn add -D @waitkit/msw
# or
bun add -D @waitkit/msw
```

## Usage

### `withWaitKit(rule, resolver)`

Wraps an MSW resolver with a `WaitKitMswRule`. The rule is evaluated before the
resolver runs: delay first, then timeout, then error.

```typescript
import { http, HttpResponse } from 'msw';
import { withWaitKit } from '@waitkit/msw';

export const handlers = [
  // 1.5 second delay before responding
  http.get(
    '/api/users',
    withWaitKit({ delay: 1500 }, () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
  ),

  // 30% chance of a 500 error
  http.post(
    '/api/orders',
    withWaitKit(
      { errorRate: 0.3, errorResponse: { status: 500, body: { message: 'Server Error' } } },
      async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 99, ...body });
      },
    ),
  ),

  // always timeout after 3 seconds
  http.get(
    '/api/slow',
    withWaitKit({ timeoutRate: 1, timeoutMs: 3000 }, () => HttpResponse.json({})),
  ),
];
```

### `WaitKitMswRule`

A subset of `WaitKitRule` without `url` and `method`. MSW handlers already
know their URL and method, so those fields are not needed.

```typescript
import type { WaitKitMswRule } from '@waitkit/msw';

const slowNetworkRule: WaitKitMswRule = {
  delay: [800, 2000], // fixed ms or [min, max] range
  errorRate: 0.2, // probability of error (0–1)
  errorResponse: {
    status: 503,
    body: { message: 'Unavailable' },
  },
  timeoutRate: 0, // probability of timeout (0–1)
  timeoutMs: 5000, // timeout duration in ms (default 30000)
};
```

## Switching scenarios with `server.use()`

Use MSW's `server.use()` to override handlers at runtime.

```typescript
import { server } from './msw-server';
import { http } from 'msw';
import { withWaitKit } from '@waitkit/msw';

// activate slow-network scenario
server.use(
  http.get(
    '/api/*',
    withWaitKit({ delay: 2000 }, ({ request }) => fetch(request)),
  ),
);

// reset to original handlers
server.resetHandlers();
```

## Timeout behavior

When `timeoutRate` triggers, `WaitKitTimeoutError` is thrown. MSW treats an
unhandled thrown error as a network failure.

```typescript
import { WaitKitTimeoutError } from '@waitkit/core';

try {
  await fetch('/api/slow');
} catch (error) {
  if (error instanceof WaitKitTimeoutError) {
    console.log('request timed out');
  }
}
```

## Evaluation order

For each request, the rule options are evaluated in this order:

1. **delay** — wait before calling the resolver
2. **timeoutRate** — if triggered, throw `WaitKitTimeoutError`
3. **errorRate** — if triggered, return an `errorResponse`-based `HttpResponse`
4. call the original resolver

## License

MIT
