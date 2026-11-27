# Waitkit

Development-only network simulation for frontend apps. Waitkit makes chosen requests slow,
failing, or hanging so you can see and test your loading, skeleton, error, timeout, and retry
states on purpose instead of waiting for a bad network to show them to you.

```ts
import { defineConfig, setupWaitKit } from '@waitkit/core';

setupWaitKit(
  defineConfig({
    scenarios: {
      'slow-network': [{ url: '/api/*', delay: [800, 2000] }],
      'server-error': [{ url: '/api/*', error: { status: 500 } }],
      flaky: [{ url: '/api/*', error: { rate: 0.3, status: 503 } }],
      timeout: [{ url: '/api/*', timeout: { ms: 5000 } }],
    },
    scenario: 'slow-network',
  }),
  { enabled: import.meta.env.DEV },
);
```

## Packages

| Package                              | What it does                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| [`@waitkit/core`](./packages/core)   | Patches `fetch` and applies delay, error, and timeout rules grouped in scenarios |
| [`@waitkit/react`](./packages/react) | Provider, hooks, and a floating devtools panel to switch scenarios at runtime    |
| [`@waitkit/msw`](./packages/msw)     | The same effects for Mock Service Worker handlers (MSW 2 and 3)                  |
| [`@waitkit/cli`](./packages/cli)     | `waitkit init`, `list`, and `validate` for `waitkit.config.ts` files             |

`@waitkit/core` holds every rule: matching, validation, and the decision of what happens to a
request. The other packages only execute that decision in their environment, so they behave the
same way.

## Upgrading from 0.x

1.0 renames and regroups most options. See the [migration guide](./docs/migration-1.0.md); the
`waitkit validate` command and the runtime error both point at every removed option.

## Development

Requires Node.js 22.18+ and pnpm (the version is pinned in `package.json`).

```sh
pnpm install
pnpm check        # format, lint, type-check, build, and test
pnpm --filter example dev
```

See [AGENTS.md](./AGENTS.md) for the repository conventions and [ROADMAP.md](./ROADMAP.md) for
what comes next.

## License

[Apache License 2.0](./LICENSE)
