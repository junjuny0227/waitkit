---
name: core-implementation
description: 'Implement Waitkit core behavior in TypeScript: fetch interception, rule matching, delay/error/timeout simulation, scenarios, controller APIs, events, tests, and public exports.'
---

# Waitkit Core Implementation

Use this skill for changes inside `packages/core`.

## Implementation Rules

- Preserve the original `fetch` and ensure `restore()` returns global state.
- Keep matching behavior deterministic except for explicitly random rate/range
  options.
- Apply the first matching rule unless the public contract changes.
- Keep simulated responses close to platform `Response` behavior.
- Keep timeout and error behavior documented and covered by tests.
- Do not hand-edit `dist/`.

## Test Rules

Add focused Vitest coverage for:

- matcher behavior
- delay ranges and deterministic delay paths
- error and timeout simulation
- scenario switching
- enable, disable, and restore behavior
- public export or type changes

Run targeted tests first when possible, then the repository quality gate.
