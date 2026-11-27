export type DelayValue = number | readonly [min: number, max: number];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Decides which requests a rule applies to.
 *
 * - `string`: a path pattern matched against the whole pathname. `:name` matches one
 *   segment and `*` matches the rest, e.g. `'/api/users/:id'` or `'/api/*'`. Patterns that
 *   start with a scheme (`'https://api.example.com/*'`) also match the origin. The query
 *   string is ignored and a trailing slash is optional.
 * - `RegExp`: tested against the absolute URL (`url.href`).
 * - function: receives the parsed absolute URL.
 */
export type UrlMatcher = string | RegExp | ((url: URL) => boolean);

/** Returns a simulated error response instead of calling the network. */
export interface WaitKitErrorEffect {
  /** Probability between 0 and 1. Defaults to 1. */
  rate?: number;
  /** Defaults to 500. */
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  /** Plain objects and arrays are sent as JSON. Strings and binary bodies are sent as-is. */
  body?: unknown;
}

/** Waits `ms` and then rejects with a `WaitKitTimeoutError`. */
export interface WaitKitTimeoutEffect {
  /** Probability between 0 and 1. Defaults to 1. */
  rate?: number;
  /** Defaults to 30 000. */
  ms?: number;
}

/** What happens to a matched request. Applied in order: delay, timeout, error. */
export interface WaitKitEffects {
  delay?: DelayValue;
  timeout?: WaitKitTimeoutEffect;
  error?: WaitKitErrorEffect;
}

export interface WaitKitRule extends WaitKitEffects {
  url: UrlMatcher;
  /** Matches every method when omitted. */
  method?: HttpMethod | readonly HttpMethod[];
}

export interface WaitKitConfig {
  /** Rules used while no scenario is active. */
  rules?: readonly WaitKitRule[];
  /** Named rule sets. An active scenario replaces `rules`; the two are never merged. */
  scenarios?: Readonly<Record<string, readonly WaitKitRule[]>>;
  /** Scenario active at startup. */
  scenario?: string;
}

export interface WaitKitOptions {
  /** Defaults to true. Gate this on your environment, e.g. `import.meta.env.DEV`. */
  enabled?: boolean;
  /** Random source for delay ranges and rates. Defaults to `Math.random`. */
  random?: () => number;
  /** Logs every simulated request with `console.info`. */
  debug?: boolean;
}

export type WaitKitOutcome =
  | { kind: 'passthrough'; delayMs: number }
  | { kind: 'error'; delayMs: number; response: Response }
  | { kind: 'timeout'; delayMs: number; timeoutMs: number };

export interface WaitKitState {
  enabled: boolean;
  scenario: string | undefined;
  disposed: boolean;
}

export interface WaitKitRequestEvent {
  /** Absolute URL of the request. */
  url: string;
  method: string;
  input: RequestInfo | URL;
  init: RequestInit | undefined;
}

export interface WaitKitMatchEvent extends WaitKitRequestEvent {
  rule: WaitKitRule;
  scenario: string | undefined;
  outcome: WaitKitOutcome;
}

export interface WaitKitErrorEvent extends WaitKitMatchEvent {
  error: Error;
}

export type WaitKitChangeReason =
  | 'enable'
  | 'disable'
  | 'setScenario'
  | 'resetScenario'
  | 'dispose';

export interface WaitKitChangeEvent {
  previous: WaitKitState;
  current: WaitKitState;
  reason: WaitKitChangeReason;
}

export interface WaitKitEventMap {
  request: WaitKitRequestEvent;
  match: WaitKitMatchEvent;
  delayStart: WaitKitMatchEvent;
  delayEnd: WaitKitMatchEvent;
  error: WaitKitErrorEvent;
  change: WaitKitChangeEvent;
}

export type WaitKitEventType = keyof WaitKitEventMap;

export type WaitKitEventListener<K extends WaitKitEventType> = (event: WaitKitEventMap[K]) => void;

export interface WaitKitController {
  /** Scenario names in declaration order. */
  readonly scenarios: readonly string[];
  /** Current state. The same object is returned until the state changes. */
  getState: () => WaitKitState;
  enable: () => void;
  disable: () => void;
  setScenario: (name: string) => void;
  resetScenario: () => void;
  /** Restores the original fetch. A disposed controller cannot be re-enabled. */
  dispose: () => void;
  on: <K extends WaitKitEventType>(type: K, listener: WaitKitEventListener<K>) => () => void;
}

export interface WaitKitValidationIssue {
  /** Location in the config, e.g. `scenarios.slow[0].error.rate`. */
  path: string;
  message: string;
}
