import {
  resolveDelay,
  shouldTrigger,
  sleep,
  validateDelay,
  validateRate,
  validateTimeoutMs,
} from './delay';
import { WaitKitTimeoutError } from './errors';
import { getRequestMethod, getRequestUrl, matchesRule } from './matcher';
import { createErrorResponse } from './response';
import type {
  WaitKitController,
  WaitKitErrorEvent,
  WaitKitEventListener,
  WaitKitEventMap,
  WaitKitEventType,
  WaitKitMatchEvent,
  WaitKitOptions,
  WaitKitRequestEvent,
  WaitKitRule,
  WaitKitScenarioChangeReason,
} from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

export function setupWaitKit(options: WaitKitOptions): WaitKitController {
  validateRuntime();
  validateOptions(options);

  const originalFetch = globalThis.fetch;
  const scenarioNamesCache = Object.keys(options.scenarios ?? {});
  let enabled = options.enabled ?? true;
  let activeScenario = options.activeScenario;
  let restored = false;

  const listenersMap = new Map<WaitKitEventType, Set<WaitKitEventListener<WaitKitEventType>>>();

  function dispatch<K extends WaitKitEventType>(type: K, event: WaitKitEventMap[K]): void {
    for (const fn of listenersMap.get(type) ?? []) {
      (fn as WaitKitEventListener<K>)(event);
    }
  }

  const patchedFetch: typeof fetch = async (input, init) => {
    if (!enabled) {
      return originalFetch.call(globalThis, input, init);
    }

    const requestEvent = createRequestEvent(input, init);
    options.onRequest?.(requestEvent);
    dispatch('request', requestEvent);

    const rule = findMatchingRule(getActiveRules(), requestEvent.url, requestEvent.method);

    if (rule === undefined) {
      return originalFetch.call(globalThis, input, init);
    }

    const delayMs = resolveDelay(rule.delay);
    const matchEvent = createMatchEvent(requestEvent, rule, activeScenario, delayMs);
    options.onMatch?.(matchEvent);
    dispatch('match', matchEvent);

    if (delayMs > 0) {
      options.onDelayStart?.(matchEvent);
      dispatch('delayStart', matchEvent);
      debug(options, `${requestEvent.method} ${requestEvent.url} delayed by ${delayMs}ms`);
      await sleep(delayMs);
      options.onDelayEnd?.(matchEvent);
      dispatch('delayEnd', matchEvent);
    }

    if (shouldTrigger(rule.timeoutRate)) {
      const timeoutMs = rule.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const error = new WaitKitTimeoutError(
        `WaitKit timed out ${requestEvent.method} ${requestEvent.url} after ${timeoutMs}ms.`,
      );
      emitError(options, dispatch, matchEvent, error);
      debug(options, `${requestEvent.method} ${requestEvent.url} timed out after ${timeoutMs}ms`);
      await sleep(timeoutMs);
      throw error;
    }

    if (shouldTrigger(rule.errorRate)) {
      const response = createErrorResponse(rule.errorResponse);
      const error = new Error(
        `WaitKit simulated ${response.status} response for ${requestEvent.method} ${requestEvent.url}.`,
      );
      emitError(options, dispatch, matchEvent, error);
      debug(options, `${requestEvent.method} ${requestEvent.url} returned ${response.status}`);
      return response;
    }

    return originalFetch.call(globalThis, input, init);
  };

  globalThis.fetch = patchedFetch;

  function getActiveRules(): readonly WaitKitRule[] {
    if (activeScenario === undefined) {
      return options.rules ?? [];
    }

    return options.scenarios?.[activeScenario] ?? [];
  }

  return {
    enable() {
      enabled = true;

      if (restored) {
        globalThis.fetch = patchedFetch;
        restored = false;
      }
    },
    disable() {
      enabled = false;
    },
    restore() {
      if (globalThis.fetch === patchedFetch) {
        globalThis.fetch = originalFetch;
      }

      enabled = false;
      restored = true;
    },
    isEnabled() {
      return enabled;
    },
    setScenario(name: string) {
      if (options.scenarios?.[name] === undefined) {
        throw new Error(`WaitKit scenario "${name}" does not exist.`);
      }

      if (activeScenario === name) {
        return;
      }

      const previousScenario = activeScenario;
      activeScenario = name;
      emitScenarioChange(options, dispatch, previousScenario, activeScenario, 'setScenario');
    },
    getScenario() {
      return activeScenario;
    },
    resetScenario() {
      if (activeScenario === undefined) {
        return;
      }

      const previousScenario = activeScenario;
      activeScenario = undefined;
      emitScenarioChange(options, dispatch, previousScenario, activeScenario, 'resetScenario');
    },
    getScenarioNames() {
      return scenarioNamesCache;
    },
    addEventListener<K extends WaitKitEventType>(type: K, listener: WaitKitEventListener<K>) {
      if (!listenersMap.has(type)) {
        listenersMap.set(type, new Set());
      }

      listenersMap.get(type)!.add(listener as WaitKitEventListener<WaitKitEventType>);

      return () => {
        listenersMap.get(type)?.delete(listener as WaitKitEventListener<WaitKitEventType>);
      };
    },
  };
}

function validateRuntime(): void {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('WaitKit requires globalThis.fetch.');
  }

  if (typeof Response !== 'function') {
    throw new Error('WaitKit requires globalThis.Response.');
  }
}

function validateOptions(options: WaitKitOptions): void {
  validateRules(options.rules ?? []);

  if (options.scenarios !== undefined) {
    for (const rules of Object.values(options.scenarios)) {
      validateRules(rules);
    }
  }

  if (
    options.activeScenario !== undefined &&
    options.scenarios?.[options.activeScenario] === undefined
  ) {
    throw new Error(`WaitKit scenario "${options.activeScenario}" does not exist.`);
  }
}

function validateRules(rules: readonly WaitKitRule[]): void {
  for (const rule of rules) {
    validateDelay(rule.delay);
    validateRate(rule.errorRate, 'errorRate');
    validateRate(rule.timeoutRate, 'timeoutRate');
    validateTimeoutMs(rule.timeoutMs);
    validateStatus(rule.errorResponse?.status);
  }
}

function validateStatus(status: number | undefined): void {
  if (status === undefined) {
    return;
  }

  if (!Number.isInteger(status) || status < 200 || status > 599) {
    throw new Error('WaitKit errorResponse.status must be an integer between 200 and 599.');
  }
}

function createRequestEvent(input: RequestInfo | URL, init?: RequestInit): WaitKitRequestEvent {
  return {
    input,
    init,
    url: getRequestUrl(input),
    method: getRequestMethod(input, init),
  };
}

function createMatchEvent(
  requestEvent: WaitKitRequestEvent,
  rule: WaitKitRule,
  scenario: string | undefined,
  delayMs: number,
): WaitKitMatchEvent {
  return {
    ...requestEvent,
    rule,
    scenario,
    delayMs,
  };
}

function findMatchingRule(
  rules: readonly WaitKitRule[],
  url: string,
  method: string,
): WaitKitRule | undefined {
  return rules.find((rule) => matchesRule(rule, url, method));
}

function emitError(
  options: WaitKitOptions,
  dispatch: <K extends WaitKitEventType>(type: K, event: WaitKitEventMap[K]) => void,
  matchEvent: WaitKitMatchEvent,
  error: Error,
): void {
  const errorEvent: WaitKitErrorEvent = {
    ...matchEvent,
    error,
  };

  options.onError?.(errorEvent);
  dispatch('error', errorEvent);
}

function emitScenarioChange(
  options: WaitKitOptions,
  dispatch: <K extends WaitKitEventType>(type: K, event: WaitKitEventMap[K]) => void,
  previousScenario: string | undefined,
  scenario: string | undefined,
  reason: WaitKitScenarioChangeReason,
): void {
  const event = { previousScenario, scenario, reason };
  options.onScenarioChange?.(event);
  dispatch('scenarioChange', event);
}

function debug(options: WaitKitOptions, message: string): void {
  if (options.debug === true) {
    console.info(`[waitkit] ${message}`);
  }
}
