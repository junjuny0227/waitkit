import { validateConfig } from './config';
import { WaitKitConfigError, WaitKitTimeoutError } from './errors';
import { normalizeRequest, selectRule } from './matcher';
import { applyOutcome, resolveOutcome } from './outcome';
import type {
  WaitKitChangeReason,
  WaitKitConfig,
  WaitKitController,
  WaitKitEventListener,
  WaitKitEventMap,
  WaitKitEventType,
  WaitKitMatchEvent,
  WaitKitOptions,
  WaitKitRequestEvent,
  WaitKitRule,
  WaitKitSettleResult,
  WaitKitState,
} from './types';

/** Shared across bundles so a second copy of the package still sees the active controller. */
const ACTIVE_CONTROLLER = Symbol.for('waitkit.activeController');

type GlobalWithController = typeof globalThis & {
  [ACTIVE_CONTROLLER]?: WaitKitController;
};

/**
 * Patches `globalThis.fetch` so matching requests are delayed, fail, or time out.
 *
 * Only one controller is active at a time: calling this again (for example after a hot
 * module reload) disposes the previous controller first.
 */
export function setupWaitKit(
  config: WaitKitConfig = {},
  options: WaitKitOptions = {},
): WaitKitController {
  if (typeof globalThis.fetch !== 'function' || typeof globalThis.Response !== 'function') {
    throw new Error('WaitKit requires globalThis.fetch and globalThis.Response.');
  }

  const issues = validateConfig(config);
  if (issues.length > 0) {
    throw new WaitKitConfigError(issues);
  }

  const host = globalThis as GlobalWithController;
  host[ACTIVE_CONTROLLER]?.dispose();

  const random = options.random ?? Math.random;
  const scenarios = Object.freeze(Object.keys(config.scenarios ?? {}));
  const listeners: { [K in WaitKitEventType]: Set<WaitKitEventListener<K>> } = {
    request: new Set(),
    match: new Set(),
    delayStart: new Set(),
    delayEnd: new Set(),
    error: new Set(),
    settle: new Set(),
    change: new Set(),
  };
  let nextRequestId = 0;
  const originalFetch = globalThis.fetch;
  let state: WaitKitState = Object.freeze({
    enabled: options.enabled ?? true,
    scenario: config.scenario,
    disposed: false,
  });

  function emit<K extends WaitKitEventType>(type: K, event: WaitKitEventMap[K]): void {
    for (const listener of listeners[type]) {
      listener(event);
    }
  }

  function update(patch: Partial<WaitKitState>, reason: WaitKitChangeReason): void {
    const previous = state;
    const next = { ...state, ...patch };

    if (
      next.enabled === previous.enabled &&
      next.scenario === previous.scenario &&
      next.disposed === previous.disposed
    ) {
      return;
    }

    state = Object.freeze(next);
    emit('change', { previous, current: state, reason });
  }

  function assertActive(action: string): void {
    if (state.disposed) {
      throw new Error(
        `WaitKit controller was disposed; cannot ${action}. Call setupWaitKit again.`,
      );
    }
  }

  function activeRules(): readonly WaitKitRule[] {
    return state.scenario === undefined
      ? (config.rules ?? [])
      : (config.scenarios?.[state.scenario] ?? []);
  }

  function debug(message: string): void {
    if (options.debug === true) {
      console.info(`[waitkit] ${message}`);
    }
  }

  const patchedFetch: typeof fetch = async (input, init) => {
    if (!state.enabled) {
      return originalFetch.call(globalThis, input, init);
    }

    const request = normalizeRequest(input, init);
    const requestEvent: WaitKitRequestEvent = {
      url: request.url.href,
      method: request.method,
      input,
      init,
    };
    emit('request', requestEvent);

    const rule = selectRule(activeRules(), request);
    if (rule === undefined) {
      return originalFetch.call(globalThis, input, init);
    }

    const outcome = resolveOutcome(rule, { random });
    nextRequestId += 1;
    const matchEvent: WaitKitMatchEvent = {
      ...requestEvent,
      id: nextRequestId,
      rule,
      scenario: state.scenario,
      outcome,
    };
    emit('match', matchEvent);
    debug(`${request.method} ${request.url.href} → ${outcome.kind} (+${outcome.delayMs}ms)`);

    let settled = false;
    const settle = (result: WaitKitSettleResult): void => {
      if (settled) return;
      settled = true;
      emit('settle', { ...matchEvent, result });
    };

    try {
      const response = await applyOutcome(outcome, {
        request: { method: request.method, url: request.url.href },
        signal: init?.signal ?? (input instanceof Request ? input.signal : undefined),
        passthrough: () => {
          settle('passthrough');
          return originalFetch.call(globalThis, input, init);
        },
        onDelayStart: () => emit('delayStart', matchEvent),
        onDelayEnd: () => emit('delayEnd', matchEvent),
        onError: (error) => emit('error', { ...matchEvent, error }),
      });
      settle('error');
      return response;
    } catch (error) {
      // A rejection from the real fetch arrives after `settle('passthrough')` and is ignored here.
      settle(error instanceof WaitKitTimeoutError ? 'timeout' : 'aborted');
      throw error;
    }
  };

  globalThis.fetch = patchedFetch;

  const controller: WaitKitController = {
    scenarios,
    getState: () => state,
    enable() {
      assertActive('enable');
      update({ enabled: true }, 'enable');
    },
    disable() {
      assertActive('disable');
      update({ enabled: false }, 'disable');
    },
    setScenario(name) {
      assertActive('set a scenario');
      if (!scenarios.includes(name)) {
        throw new Error(
          `WaitKit scenario "${name}" does not exist. Known scenarios: ${scenarios.join(', ') || '(none)'}.`,
        );
      }
      update({ scenario: name }, 'setScenario');
    },
    resetScenario() {
      assertActive('reset the scenario');
      update({ scenario: undefined }, 'resetScenario');
    },
    dispose() {
      if (state.disposed) return;

      // If something patched fetch after us, leave it in place; our patch becomes a passthrough.
      if (globalThis.fetch === patchedFetch) {
        globalThis.fetch = originalFetch;
      }
      if (host[ACTIVE_CONTROLLER] === controller) {
        delete host[ACTIVE_CONTROLLER];
      }

      update({ enabled: false, disposed: true }, 'dispose');
      for (const set of Object.values(listeners)) set.clear();
    },
    on(type, listener) {
      const set = listeners[type];
      set.add(listener);

      return () => {
        set.delete(listener);
      };
    },
  };

  host[ACTIVE_CONTROLLER] = controller;
  return controller;
}
