import type { WaitKitController } from '@waitkit/core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { WaitKitContext } from './wait-kit-context';
import { createWaitKitReactStore } from './wait-kit-store';

export interface WaitKitProviderProps {
  controller: WaitKitController;
  scenarioNames?: readonly string[];
  children: ReactNode;
}

export function WaitKitProvider({ controller, scenarioNames, children }: WaitKitProviderProps) {
  const effectiveNames = useMemo(
    () => scenarioNames ?? controller.getScenarioNames(),
    [controller, scenarioNames],
  );

  const store = useMemo(
    () => createWaitKitReactStore(controller, effectiveNames),
    [controller, effectiveNames],
  );

  return <WaitKitContext.Provider value={store}>{children}</WaitKitContext.Provider>;
}
