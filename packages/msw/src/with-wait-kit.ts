import { WaitKitTimeoutError } from '@waitkit/core';
import { HttpResponse, type HttpResponseResolver } from 'msw';

import type { WaitKitMswRule } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

export function withWaitKit(
  rule: WaitKitMswRule,
  resolver: HttpResponseResolver,
): HttpResponseResolver {
  return async (args) => {
    if (rule.delay !== undefined) {
      await sleep(resolveDelay(rule.delay));
    }

    if (shouldTrigger(rule.timeoutRate)) {
      const timeoutMs = rule.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      await sleep(timeoutMs);
      throw new WaitKitTimeoutError(
        `WaitKit timed out ${args.request.method} ${args.request.url} after ${timeoutMs}ms.`,
      );
    }

    if (shouldTrigger(rule.errorRate)) {
      return createErrorResponse(rule.errorResponse);
    }

    return resolver(args);
  };
}

function resolveDelay(delay: NonNullable<WaitKitMswRule['delay']>): number {
  if (typeof delay === 'number') {
    return delay;
  }

  const [min, max] = delay;
  return Math.floor(min + Math.random() * (max - min + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function createErrorResponse(
  errorResponse: WaitKitMswRule['errorResponse'],
): HttpResponse<BodyInit | null> {
  const status = errorResponse?.status ?? 500;
  const headers = new Headers(errorResponse?.headers);
  const body = serializeBody(errorResponse?.body, headers);

  return new HttpResponse(body, {
    status,
    statusText: errorResponse?.statusText,
    headers,
  });
}

function serializeBody(body: unknown, headers: Headers): BodyInit | null {
  if (body === undefined || body === null) {
    return null;
  }

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof Blob || body instanceof FormData || body instanceof ArrayBuffer) {
    return body;
  }

  if (ArrayBuffer.isView(body)) {
    return body as BodyInit;
  }

  if (body instanceof URLSearchParams) {
    return body;
  }

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return JSON.stringify(body);
}
