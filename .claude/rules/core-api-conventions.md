---
description: 'Core API behavior rules for Waitkit fetch interception, rule matching, delay, error, timeout, scenarios, and controller APIs.'
paths:
  - 'packages/core/src/**/*'
  - 'packages/core/tests/**/*'
  - 'packages/core/README.md'
---

# Core API Conventions

Use these rules for `@waitkit/core` behavior.

## Runtime Behavior

- Waitkit is a development tool; users must opt in with environment gates.
- `setupWaitKit` patches `globalThis.fetch` and must restore it reliably.
- Disabled controllers should bypass rules and call the original `fetch`.
- The first matching rule is applied unless the public API changes.
- Random delay, error, and timeout behavior must be testable.

## API Design

- Keep rule options explicit and serializable where practical.
- Keep scenario APIs simple: set, get, reset, restore.
- Do not add framework-specific concepts to core.
- Document timeout and simulated error shapes when behavior changes.

## Tests

- Add tests with the behavior change.
- Cover restore behavior for anything that touches global state.
- Prefer focused unit tests over broad snapshots.
