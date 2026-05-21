export type DelayValue = number | readonly [min: number, max: number];

export type UrlMatcher = string | RegExp | ((url: string) => boolean);

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

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
}

export interface WaitKitController {
  enable: () => void;
  disable: () => void;
  restore: () => void;
  isEnabled: () => boolean;
  setScenario: (name: string) => void;
  getScenario: () => string | undefined;
  resetScenario: () => void;
}
