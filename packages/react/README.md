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

A fixed panel with an on/off switch, one button per scenario plus `base` (no scenario), and a
log of simulated requests showing whether each was delayed, failed (with its status), or timed
out. It renders nothing once the controller is disposed.

| Prop            | Default          | Description                                                    |
| --------------- | ---------------- | -------------------------------------------------------------- |
| `position`      | `'bottom-right'` | `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `defaultOpen`   | `true`           | Start expanded                                                 |
| `maxLogEntries` | `20`             | Number of log entries kept                                     |

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
