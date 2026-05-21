# waitkit

Development-only network simulation tools for intentionally testing loading,
skeleton, error, timeout, and retry states.

## Packages

- [`@waitkit/core`](./packages/core): Fetch interceptor for applying delay,
  error, timeout, and scenario rules to matching requests.
- [`@waitkit/react`](./packages/react): React provider and hooks for controlling
  a Waitkit controller from development UI.

## Planned

- `@waitkit/msw`: MSW integration.
- `@waitkit/cli`: CLI utilities for local development workflows.
