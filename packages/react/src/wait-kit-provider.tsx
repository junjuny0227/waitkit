import type { WaitKitController } from '@waitkit/core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { WaitKitContext } from './wait-kit-context';
import { createWaitKitReactStore } from './wait-kit-store';

const EMPTY_SCENARIO_NAMES: readonly string[] = [];

export interface WaitKitProviderProps {
  controller: WaitKitController;
  scenarioNames?: readonly string[];
  children: ReactNode;
}

export function WaitKitProvider({
  controller,
  scenarioNames = EMPTY_SCENARIO_NAMES,
  children,
}: WaitKitProviderProps) {
  const store = useMemo(
    () => createWaitKitReactStore(controller, scenarioNames),
    [controller, scenarioNames],
  );

  return <WaitKitContext.Provider value={store}>{children}</WaitKitContext.Provider>;
}
