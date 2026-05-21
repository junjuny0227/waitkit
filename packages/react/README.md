# @waitkit/react

React provider and hooks for using a Waitkit controller in development UI.

`@waitkit/react` does not call `setupWaitKit` for you. Create the controller
with `@waitkit/core`, then pass it to `WaitKitProvider`.

## Installation

```bash
npm install @waitkit/core @waitkit/react
# or
pnpm add @waitkit/core @waitkit/react
# or
yarn add @waitkit/core @waitkit/react
# or
bun add @waitkit/core @waitkit/react
```

## Provider

```tsx
import { setupWaitKit } from '@waitkit/core';
import { WaitKitProvider } from '@waitkit/react';

const scenarios = {
  'slow-network': [{ url: '/api/users', delay: 1000 }],
  'server-error': [{ url: '/api/users', errorRate: 1 }],
};

const scenarioNames = Object.keys(scenarios);

const waitkit = setupWaitKit({
  enabled: import.meta.env.DEV,
  activeScenario: 'slow-network',
  scenarios,
});

root.render(
  <WaitKitProvider controller={waitkit} scenarioNames={scenarioNames}>
    <App />
  </WaitKitProvider>,
);
```

Pass a stable `scenarioNames` array. Avoid creating it inline during render,
because changing the array reference recreates the React store.

## useWaitKit

```tsx
import { useWaitKit } from '@waitkit/react';

function WaitKitToggle() {
  const waitkit = useWaitKit();

  return (
    <button onClick={waitkit.enabled ? waitkit.disable : waitkit.enable}>
      {waitkit.enabled ? 'Disable Waitkit' : 'Enable Waitkit'}
    </button>
  );
}
```

`useWaitKit` returns:

- `enabled`: whether rule matching is enabled.
- `scenario`: active scenario name.
- `scenarioNames`: scenario names passed to `WaitKitProvider`.
- `controller`: original core controller.
- `enable()`, `disable()`, `restore()`: controller methods that also update React subscribers.

## useWaitKitScenario

```tsx
import { useWaitKitScenario } from '@waitkit/react';

function ScenarioSelect() {
  const { scenario, scenarioNames, setScenario, resetScenario } = useWaitKitScenario();

  return (
    <select
      value={scenario ?? ''}
      onChange={(event) => {
        const value = event.currentTarget.value;
        value === '' ? resetScenario() : setScenario(value);
      }}
    >
      <option value="">Default rules</option>
      {scenarioNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
```

## Controller Updates

Use the methods returned by `useWaitKit` and `useWaitKitScenario` from React UI.
If you call the original controller directly outside React, React subscribers
will not be notified automatically.
