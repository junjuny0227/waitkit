# @waitkit/react

React bindings for [`@waitkit/core`](../core): a provider, hooks, and a floating devtools panel
to toggle Waitkit and switch scenarios while the app runs.

```sh
npm install -D @waitkit/core @waitkit/react
```

## Usage

```tsx
import { setupWaitKit } from '@waitkit/core';
import { WaitKitDevTools, WaitKitProvider } from '@waitkit/react';

import config from './waitkit.config';

const waitkit = setupWaitKit(config, { enabled: import.meta.env.DEV });

export function Root() {
  return (
    <WaitKitProvider controller={waitkit}>
      <App />
      {import.meta.env.DEV && <WaitKitDevTools />}
    </WaitKitProvider>
  );
}
```

## `<WaitKitDevTools />`

A floating panel with an on/off switch, one chip per scenario plus `base` (no scenario), and
the activity of simulated requests. Requests that are still waiting show the remaining time and
a progress bar; finished ones show how they ended (delay, error status, timeout, or aborted).
It collapses to a small launcher that shows the current scenario and how many requests are
waiting, remembers its open state in `localStorage`, and renders nothing once the controller
is disposed. The panel lives in a shadow root, so your app's CSS does not affect it.

Requires `react-dom` (the panel is rendered through a portal).

| Prop            | Default          | Description                                                    |
| --------------- | ---------------- | -------------------------------------------------------------- |
| `position`      | `'bottom-right'` | `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `defaultOpen`   | `true`           | Start expanded when no open state is stored yet                |
| `maxLogEntries` | `20`             | Number of requests kept in the activity list                   |
| `theme`         | `'dark'`         | `'dark'`, `'light'`, or `'system'`                             |
| `shortcut`      | `'alt+shift+w'`  | Shortcut that toggles the panel; `false` disables it           |

## Hooks

### `useWaitKit()`

Returns the controller state and its actions, and re-renders whenever the state changes, also
when the controller is changed outside React.

```tsx
function ScenarioPicker() {
  const { scenario, scenarios, setScenario, resetScenario, enabled, enable, disable } =
    useWaitKit();
  // ...
}
```

### `useWaitKitEvent(type, listener)`

Subscribes to a controller event for the lifetime of the component. The listener does not need
to be memoized.

```tsx
useWaitKitEvent('error', (event) => toast(`Simulated failure: ${event.url}`));
```

### `useWaitKitController()`

Returns the controller from the nearest provider.

All hooks throw when used outside `<WaitKitProvider>`.

## License

Apache-2.0
