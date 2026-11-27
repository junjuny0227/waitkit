---
description: 'Behavior contract of @waitkit/core: config shape, matching, outcomes, controller, events.'
paths:
  - 'packages/core/src/**/*'
  - 'packages/core/tests/**/*'
  - 'packages/core/README.md'
---

# Core API conventions

These are promises to users. Changing any of them is a breaking change.

## Config

- Effects are grouped: `delay`, `timeout: { rate, ms }`, `error: { rate, status, statusText,
  headers, body }`. `rate` defaults to 1, `timeout.ms` to 30 000, `error.status` to 500.
- Effects apply in order delay → timeout → error → passthrough. The first matching rule wins.
- An active scenario replaces `rules`; they are never merged.
- `validateConfig` reports every issue with a path and never throws. Unknown keys are issues;
  keys removed in 1.0 get a message naming the replacement (`REMOVED_KEYS` in `config.ts`).
  When an option is renamed, add the old name there.

## Matching

- String `url` = path pattern on the whole pathname: `:param` is one segment, `*` the rest,
  query ignored, trailing slash optional; a scheme in the pattern also matches the origin.
- RegExp tests `url.href`; functions receive a `URL`. Relative request URLs resolve against
  `location.href`, else `http://localhost`.

## Outcomes and execution

- `resolveOutcome` is pure apart from the injected `random`; it never waits or emits.
- `applyOutcome` waits, emits through its callbacks, and honors `AbortSignal` (reject with
  `signal.reason`). Adapters use these two instead of their own timing code.
- Timeout errors are `WaitKitTimeoutError` with the message
  `WaitKit timed out <METHOD> <url> after <ms>ms.`; tests in core and msw pin it.

## Controller

- `getState()` returns the same frozen object until something changes; React relies on this for
  `useSyncExternalStore`.
- Every state change emits one `change` event; no-op calls emit nothing.
- `dispose()` is final, restores `fetch` only if our patch is still installed, and clears
  listeners. A new `setupWaitKit` disposes the previous controller.

## Tests

- Every behavior change comes with a test in `packages/core/tests`.
- Use the `random` option for probabilistic paths and fake timers for waits.
