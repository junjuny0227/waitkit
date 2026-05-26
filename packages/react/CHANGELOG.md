# @waitkit/react

## 0.4.0

### Minor Changes

- 25c8875: `WaitKitProvider` now auto-derives scenario names via `controller.getScenarioNames()` when the `scenarioNames` prop is omitted. The prop remains available as an explicit override.

  Added a Restore button to `WaitKitDevTools`. Clicking it calls `controller.restore()` to reinstate the original fetch.

### Patch Changes

- Updated dependencies [25c8875]
  - @waitkit/core@0.4.0

## 0.3.0

### Minor Changes

- 574c944: Add `WaitKitDevTools` component — a fixed floating panel for development.

  Shows current enabled/disabled state, scenario switcher, and a live log of recent matched and error requests. Accepts an optional `maxLogEntries` prop (default 20).

### Patch Changes

- Updated dependencies [574c944]
  - @waitkit/core@0.3.0

## 0.2.0

### Minor Changes

- 9bee080: Add the initial React provider and hooks package for controlling Waitkit controllers.
- Prepare the first release of @waitkit/react 0.1.0 with React provider and hook APIs for Waitkit controllers.
