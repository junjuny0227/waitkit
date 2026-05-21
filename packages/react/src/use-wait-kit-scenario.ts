import { useContext, useMemo, useSyncExternalStore } from 'react';

import { WaitKitContext } from './wait-kit-context';
import type { WaitKitScenarioControls } from './wait-kit-store';

export function useWaitKitScenario(): WaitKitScenarioControls {
  const store = useContext(WaitKitContext);

  if (store === null) {
    throw new Error('useWaitKitScenario must be used within WaitKitProvider.');
  }

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  return useMemo(
    () => ({
      scenario: state.scenario,
      scenarioNames: state.scenarioNames,
      setScenario: store.setScenario,
      resetScenario: store.resetScenario,
    }),
    [state, store],
  );
}
