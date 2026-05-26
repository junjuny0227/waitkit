import { resolveDelay, shouldTrigger, sleep, WaitKitTimeoutError } from '@waitkit/core';
import { type DefaultBodyType, HttpResponse, type HttpResponseResolver } from 'msw';

import type { WaitKitMswRule } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

export function withWaitKit<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Params extends Record<string, any> = any,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  ResponseBodyType extends DefaultBodyType = DefaultBodyType,
>(
  rule: WaitKitMswRule,
  resolver: HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>,
): HttpResponseResolver<Params, RequestBodyType, ResponseBodyType> {
  return (async (args) => {
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
  }) as HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>;
}

function createErrorResponse(
  errorResponse: WaitKitMswRule['errorResponse'],
): HttpResponse<DefaultBodyType> {
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
