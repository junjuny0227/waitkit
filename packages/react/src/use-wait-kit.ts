import { useContext, useMemo, useSyncExternalStore } from 'react';

import { WaitKitContext } from './wait-kit-context';
import type { WaitKitReactController } from './wait-kit-store';

export function useWaitKit(): WaitKitReactController {
  const store = useContext(WaitKitContext);

  if (store === null) {
    throw new Error('useWaitKit must be used within WaitKitProvider.');
  }

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  return useMemo(
    () => ({
      ...state,
      controller: store.controller,
      enable: store.enable,
      disable: store.disable,
      restore: store.restore,
    }),
    [state, store],
  );
}
