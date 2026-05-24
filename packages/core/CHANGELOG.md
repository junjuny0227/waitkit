# @waitkit/core

## 0.3.0

### Minor Changes

- 574c944: Add `addEventListener` to `WaitKitController` for dynamic event subscription.

  Returns an unsubscribe function. Supported event types: `request`, `match`, `error`, `scenarioChange`.

  Also adds `WaitKitEventMap`, `WaitKitEventType`, and `WaitKitEventListener` types to the public API.

## 0.2.0

### Minor Changes

- Add scenario change events and document the finalized P1 core behavior, including rule matching, timeout/error semantics, response simulation handling, and event payloads.

## 0.1.1

### Patch Changes

- Update README documentation for package overview and usage.

## 0.1.0

### Minor Changes

- Initial release of @waitkit/core with development-only fetch interception, delay, error, timeout, scenario, and controller APIs.
