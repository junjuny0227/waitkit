import type { WaitKitController } from '@waitkit/core';

export interface WaitKitReactState {
  enabled: boolean;
  scenario: string | undefined;
  scenarioNames: readonly string[];
}

export interface WaitKitReactController extends WaitKitReactState {
  controller: WaitKitController;
  enable: () => void;
  disable: () => void;
  restore: () => void;
}

export interface WaitKitScenarioControls {
  scenario: string | undefined;
  scenarioNames: readonly string[];
  setScenario: (name: string) => void;
  resetScenario: () => void;
}

export interface WaitKitReactStore {
  controller: WaitKitController;
  enable: () => void;
  disable: () => void;
  restore: () => void;
  setScenario: (name: string) => void;
  resetScenario: () => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => WaitKitReactState;
  getServerSnapshot: () => WaitKitReactState;
}

export function createWaitKitReactStore(
  controller: WaitKitController,
  scenarioNames: readonly string[] = [],
): WaitKitReactStore {
  const listeners = new Set<() => void>();
  let snapshot = createSnapshot(controller, scenarioNames);

  function notify(): void {
    const nextSnapshot = createSnapshot(controller, scenarioNames);

    if (isSameSnapshot(snapshot, nextSnapshot)) {
      return;
    }

    snapshot = nextSnapshot;

    for (const listener of listeners) {
      listener();
    }
  }

  return {
    controller,
    enable() {
      controller.enable();
      notify();
    },
    disable() {
      controller.disable();
      notify();
    },
    restore() {
      controller.restore();
      notify();
    },
    setScenario(name: string) {
      controller.setScenario(name);
      notify();
    },
    resetScenario() {
      controller.resetScenario();
      notify();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    getServerSnapshot() {
      return snapshot;
    },
  };
}

function createSnapshot(
  controller: WaitKitController,
  scenarioNames: readonly string[],
): WaitKitReactState {
  return {
    enabled: controller.isEnabled(),
    scenario: controller.getScenario(),
    scenarioNames,
  };
}

function isSameSnapshot(previous: WaitKitReactState, next: WaitKitReactState): boolean {
  return (
    previous.enabled === next.enabled &&
    previous.scenario === next.scenario &&
    previous.scenarioNames === next.scenarioNames
  );
}
