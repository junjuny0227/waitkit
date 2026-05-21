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

export function WaitKitProvider({
  controller,
  scenarioNames = [],
  children,
}: WaitKitProviderProps) {
  const store = useMemo(
    () => createWaitKitReactStore(controller, scenarioNames),
    [controller, scenarioNames],
  );

  return <WaitKitContext.Provider value={store}>{children}</WaitKitContext.Provider>;
}
