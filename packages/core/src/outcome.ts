import { WaitKitTimeoutError } from './errors';
import type { DelayValue, WaitKitEffects, WaitKitErrorEffect, WaitKitOutcome } from './types';

export const DEFAULT_ERROR_STATUS = 500;
export const DEFAULT_TIMEOUT_MS = 30_000;

export interface ResolveOutcomeOptions {
  /** Defaults to `Math.random`. */
  random?: () => number;
}

/**
 * Decides what happens to a request. Pure apart from `random`: it never waits, patches,
 * or emits events, so every adapter (fetch, MSW, ...) shares the same policy.
 */
export function resolveOutcome(
  effects: WaitKitEffects,
  { random = Math.random }: ResolveOutcomeOptions = {},
): WaitKitOutcome {
  const delayMs = resolveDelay(effects.delay, random);

  if (effects.timeout !== undefined && triggers(effects.timeout.rate, random)) {
    return { kind: 'timeout', delayMs, timeoutMs: effects.timeout.ms ?? DEFAULT_TIMEOUT_MS };
  }

  if (effects.error !== undefined && triggers(effects.error.rate, random)) {
    return { kind: 'error', delayMs, response: createSimulatedResponse(effects.error) };
  }

  return { kind: 'passthrough', delayMs };
}

export interface ApplyOutcomeOptions<T> {
  /** Describes the request in the timeout error message. */
  request: { method: string; url: string };
  /** Performs the real request. Called only for `passthrough`. */
  passthrough: () => T | Promise<T>;
  /** Abort signal of the request. Aborting rejects any pending wait with `signal.reason`. */
  signal?: AbortSignal | null | undefined;
  onDelayStart?: () => void;
  onDelayEnd?: () => void;
  /** Called before a timeout starts waiting or an error response is returned. */
  onError?: (error: Error) => void;
}

/** Executes an outcome: waits, then rejects, returns the simulated response, or passes through. */
export async function applyOutcome<T>(
  outcome: WaitKitOutcome,
  options: ApplyOutcomeOptions<T>,
): Promise<T | Response> {
  const { request, signal } = options;

  if (outcome.delayMs > 0) {
    options.onDelayStart?.();
    await sleep(outcome.delayMs, signal);
    options.onDelayEnd?.();
  }

  if (outcome.kind === 'timeout') {
    const error = new WaitKitTimeoutError(
      `WaitKit timed out ${request.method} ${request.url} after ${outcome.timeoutMs}ms.`,
      outcome.timeoutMs,
    );
    options.onError?.(error);
    await sleep(outcome.timeoutMs, signal);
    throw error;
  }

  if (outcome.kind === 'error') {
    options.onError?.(
      new Error(
        `WaitKit simulated ${outcome.response.status} response for ${request.method} ${request.url}.`,
      ),
    );
    return outcome.response;
  }

  return options.passthrough();
}

/** Resolves after `ms`, or rejects with `signal.reason` as soon as the signal aborts. */
export function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function resolveDelay(delay: DelayValue | undefined, random: () => number): number {
  if (delay === undefined) {
    return 0;
  }

  if (typeof delay === 'number') {
    return delay;
  }

  const [min, max] = delay;
  return Math.floor(min + random() * (max - min + 1));
}

function triggers(rate: number | undefined, random: () => number): boolean {
  const probability = rate ?? 1;

  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return random() < probability;
}

function createSimulatedResponse(effect: WaitKitErrorEffect): Response {
  const headers = new Headers(effect.headers);
  const body = serializeBody(effect.body, headers);
  const init: ResponseInit = { status: effect.status ?? DEFAULT_ERROR_STATUS, headers };

  if (effect.statusText !== undefined) {
    init.statusText = effect.statusText;
  }

  return new Response(body, init);
}

function serializeBody(body: unknown, headers: Headers): BodyInit | null {
  if (body === undefined || body === null) {
    return null;
  }

  if (isRawBody(body)) {
    return body;
  }

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return JSON.stringify(body);
}

/** Bodies `Response` accepts as-is. Globals are checked first so this also runs where they are missing. */
function isRawBody(body: unknown): body is BodyInit {
  return (
    typeof body === 'string' ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    (typeof Blob === 'function' && body instanceof Blob) ||
    (typeof FormData === 'function' && body instanceof FormData) ||
    (typeof URLSearchParams === 'function' && body instanceof URLSearchParams)
  );
}
