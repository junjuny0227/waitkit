import type {
  WaitKitController,
  WaitKitEventListener,
  WaitKitEventType,
  WaitKitState,
} from '@waitkit/core';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { useWaitKitController } from './provider';

export interface UseWaitKitResult extends WaitKitState {
  controller: WaitKitController;
  /** Scenario names in declaration order. */
  scenarios: readonly string[];
  enable: () => void;
  disable: () => void;
  setScenario: (name: string) => void;
  resetScenario: () => void;
}

/** Current controller state plus its actions. Re-renders whenever the state changes. */
export function useWaitKit(): UseWaitKitResult {
  const controller = useWaitKitController();
  const subscribe = useCallback(
    (onChange: () => void) => controller.on('change', onChange),
    [controller],
  );
  const state = useSyncExternalStore(subscribe, controller.getState, controller.getState);

  return useMemo(
    () => ({
      ...state,
      controller,
      scenarios: controller.scenarios,
      enable: controller.enable,
      disable: controller.disable,
      setScenario: controller.setScenario,
      resetScenario: controller.resetScenario,
    }),
    [state, controller],
  );
}

/**
 * Subscribes to a controller event for the lifetime of the component. The latest
 * `listener` is always called, so it does not need to be memoized.
 */
export function useWaitKitEvent<K extends WaitKitEventType>(
  type: K,
  listener: WaitKitEventListener<K>,
): void {
  const controller = useWaitKitController();
  const latest = useRef(listener);

  useEffect(() => {
    latest.current = listener;
  });

  useEffect(() => controller.on(type, (event) => latest.current(event)), [controller, type]);
}
