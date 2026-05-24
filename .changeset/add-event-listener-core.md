---
"@waitkit/core": minor
---

Add `addEventListener` to `WaitKitController` for dynamic event subscription.

Returns an unsubscribe function. Supported event types: `request`, `match`, `error`, `scenarioChange`.

Also adds `WaitKitEventMap`, `WaitKitEventType`, and `WaitKitEventListener` types to the public API.
