import {
  resolveDelay,
  sleep,
  validateDelay,
  validateRate,
  validateTimeoutMs,
} from "./delay";
import { WaitKitTimeoutError } from "./errors";
import { getRequestMethod, getRequestUrl, matchesRule } from "./matcher";
import { createErrorResponse } from "./response";
import type {
  WaitKitController,
  WaitKitErrorEvent,
  WaitKitMatchEvent,
  WaitKitOptions,
  WaitKitRequestEvent,
  WaitKitRule,
} from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

export function setupWaitKit(options: WaitKitOptions): WaitKitController {
  validateRuntime();
  validateOptions(options);

  const originalFetch = globalThis.fetch;
  let enabled = options.enabled ?? true;
  let activeScenario = options.activeScenario;
  let restored = false;

  const patchedFetch: typeof fetch = async (input, init) => {
    if (!enabled) {
      return originalFetch.call(globalThis, input, init);
    }

    const requestEvent = createRequestEvent(input, init);
    options.onRequest?.(requestEvent);

    const rule = findMatchingRule(
      getActiveRules(),
      requestEvent.url,
      requestEvent.method,
    );

    if (rule === undefined) {
      return originalFetch.call(globalThis, input, init);
    }

    const delayMs = resolveDelay(rule.delay);
    const matchEvent = createMatchEvent(
      requestEvent,
      rule,
      activeScenario,
      delayMs,
    );
    options.onMatch?.(matchEvent);

    if (delayMs > 0) {
      options.onDelayStart?.(matchEvent);
      debug(
        options,
        `${requestEvent.method} ${requestEvent.url} delayed by ${delayMs}ms`,
      );
      await sleep(delayMs);
      options.onDelayEnd?.(matchEvent);
    }

    if (shouldTrigger(rule.timeoutRate)) {
      const timeoutMs = rule.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const error = new WaitKitTimeoutError(
        `WaitKit timed out ${requestEvent.method} ${requestEvent.url} after ${timeoutMs}ms.`,
      );
      emitError(options, matchEvent, error);
      debug(
        options,
        `${requestEvent.method} ${requestEvent.url} timed out after ${timeoutMs}ms`,
      );
      await sleep(timeoutMs);
      throw error;
    }

    if (shouldTrigger(rule.errorRate)) {
      const response = createErrorResponse(rule.errorResponse);
      const error = new Error(
        `WaitKit simulated ${response.status} response for ${requestEvent.method} ${requestEvent.url}.`,
      );
      emitError(options, matchEvent, error);
      debug(
        options,
        `${requestEvent.method} ${requestEvent.url} returned ${response.status}`,
      );
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

      activeScenario = name;
    },
    getScenario() {
      return activeScenario;
    },
    resetScenario() {
      activeScenario = undefined;
    },
  };
}

function validateRuntime(): void {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("WaitKit requires globalThis.fetch.");
  }

  if (typeof Response !== "function") {
    throw new Error("WaitKit requires globalThis.Response.");
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
    throw new Error(
      `WaitKit scenario "${options.activeScenario}" does not exist.`,
    );
  }
}

function validateRules(rules: readonly WaitKitRule[]): void {
  for (const rule of rules) {
    validateDelay(rule.delay);
    validateRate(rule.errorRate, "errorRate");
    validateRate(rule.timeoutRate, "timeoutRate");
    validateTimeoutMs(rule.timeoutMs);
    validateStatus(rule.errorResponse?.status);
  }
}

function validateStatus(status: number | undefined): void {
  if (status === undefined) {
    return;
  }

  if (!Number.isInteger(status) || status < 200 || status > 599) {
    throw new Error(
      "WaitKit errorResponse.status must be an integer between 200 and 599.",
    );
  }
}

function createRequestEvent(
  input: RequestInfo | URL,
  init?: RequestInit,
): WaitKitRequestEvent {
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

function shouldTrigger(rate: number | undefined): boolean {
  if (rate === undefined || rate <= 0) {
    return false;
  }

  if (rate >= 1) {
    return true;
  }

  return Math.random() < rate;
}

function emitError(
  options: WaitKitOptions,
  matchEvent: WaitKitMatchEvent,
  error: Error,
): void {
  const errorEvent: WaitKitErrorEvent = {
    ...matchEvent,
    error,
  };

  options.onError?.(errorEvent);
}

function debug(options: WaitKitOptions, message: string): void {
  if (options.debug === true) {
    console.info(`[waitkit] ${message}`);
  }
}
