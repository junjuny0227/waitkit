export type DelayValue = number | readonly [min: number, max: number];

/**
 * string: URL에 해당 문자열이 포함되면 매칭 (substring match).
 * 정확한 경로나 패턴 제어는 RegExp 또는 함수를 사용.
 */
export type UrlMatcher = string | RegExp | ((url: string) => boolean);

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface WaitKitErrorResponse {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  body?: unknown;
}

export interface WaitKitRule {
  url: UrlMatcher;
  method?: HttpMethod | readonly HttpMethod[];
  delay?: DelayValue;
  errorRate?: number;
  timeoutRate?: number;
  timeoutMs?: number;
  errorResponse?: WaitKitErrorResponse;
}

export interface WaitKitRequestEvent {
  input: RequestInfo | URL;
  init?: RequestInit;
  url: string;
  method: string;
}

export interface WaitKitMatchEvent extends WaitKitRequestEvent {
  rule: WaitKitRule;
  scenario?: string;
  delayMs: number;
}

export type WaitKitDelayEvent = WaitKitMatchEvent;

export interface WaitKitErrorEvent extends WaitKitMatchEvent {
  error: Error;
}

export type WaitKitScenarioChangeReason = 'setScenario' | 'resetScenario';

export interface WaitKitScenarioChangeEvent {
  previousScenario?: string;
  scenario?: string;
  reason: WaitKitScenarioChangeReason;
}

export interface WaitKitOptions {
  enabled?: boolean;
  rules?: readonly WaitKitRule[];
  scenarios?: Record<string, readonly WaitKitRule[]>;
  activeScenario?: string;
  debug?: boolean;
  onRequest?: (event: WaitKitRequestEvent) => void;
  onMatch?: (event: WaitKitMatchEvent) => void;
  onDelayStart?: (event: WaitKitDelayEvent) => void;
  onDelayEnd?: (event: WaitKitDelayEvent) => void;
  onError?: (event: WaitKitErrorEvent) => void;
  onScenarioChange?: (event: WaitKitScenarioChangeEvent) => void;
}

export interface WaitKitEventMap {
  request: WaitKitRequestEvent;
  match: WaitKitMatchEvent;
  delayStart: WaitKitDelayEvent;
  delayEnd: WaitKitDelayEvent;
  error: WaitKitErrorEvent;
  scenarioChange: WaitKitScenarioChangeEvent;
}

export type WaitKitEventType = keyof WaitKitEventMap;

export type WaitKitEventListener<K extends WaitKitEventType> = (event: WaitKitEventMap[K]) => void;

export interface WaitKitController {
  enable: () => void;
  disable: () => void;
  restore: () => void;
  isEnabled: () => boolean;
  setScenario: (name: string) => void;
  getScenario: () => string | undefined;
  resetScenario: () => void;
  getScenarioNames: () => readonly string[];
  addEventListener: <K extends WaitKitEventType>(
    type: K,
    listener: WaitKitEventListener<K>,
  ) => () => void;
}
