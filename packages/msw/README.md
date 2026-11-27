# @waitkit/msw

[Waitkit](../core) effects for [Mock Service Worker](https://mswjs.io) handlers: delay a mocked
response, replace it with a simulated error, or let it hang until it times out. Works with MSW 2
and 3.

```sh
npm install -D @waitkit/msw msw
```

## Usage

```ts
import { withWaitKit } from '@waitkit/msw';
import { HttpResponse, http } from 'msw'; // MSW 3: import { HttpResponse, http } from 'msw/http'

export const handlers = [
  http.get(
    '/api/users',
    withWaitKit({ delay: [300, 1200] }, () => HttpResponse.json([{ id: 1, name: 'Ada' }])),
  ),
  http.post(
    '/api/orders',
    withWaitKit({ error: { rate: 0.2, status: 503, body: { message: 'Try again' } } }, () =>
      HttpResponse.json({ ok: true }, { status: 201 }),
    ),
  ),
  http.get(
    '/api/report',
    withWaitKit({ timeout: { ms: 10_000 } }, () => HttpResponse.json({})),
  ),
];
```

`withWaitKit(effects, resolver, options?)` takes the same `delay`, `timeout`, and `error` effects
as a `@waitkit/core` rule; URL and method matching stay with MSW. The resolver's arguments keep
their MSW types, including `params`.

Behavior is shared with `@waitkit/core`:

- Effects run in order: `delay`, then `timeout`, then `error`, otherwise your resolver.
- `rate` defaults to 1; `timeout.ms` defaults to 30 000; `error.status` defaults to 500.
- Aborting the request cancels a pending delay or timeout.
- Invalid effects throw a `WaitKitConfigError` when the handler is created.

A timeout rejects with `WaitKitTimeoutError`. MSW turns an exception thrown by a resolver into a
500 response, so with MSW the client sees a late 500 rather than a network error.

Pass `{ random }` as the third argument to make rates and delay ranges deterministic in tests.

## License

Apache-2.0
