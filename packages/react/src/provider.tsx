import type { WaitKitController } from '@waitkit/core';
import { createContext, type ReactNode, useContext } from 'react';

const WaitKitContext = createContext<WaitKitController | null>(null);
WaitKitContext.displayName = 'WaitKitContext';

export interface WaitKitProviderProps {
  /** Controller returned by `setupWaitKit`. */
  controller: WaitKitController;
  children?: ReactNode;
}

export function WaitKitProvider({ controller, children }: WaitKitProviderProps): ReactNode {
  return <WaitKitContext.Provider value={controller}>{children}</WaitKitContext.Provider>;
}

export function useWaitKitController(): WaitKitController {
  const controller = useContext(WaitKitContext);

  if (controller === null) {
    throw new Error('Waitkit hooks must be used inside <WaitKitProvider>.');
  }

  return controller;
}
