import {
  applyOutcome,
  resolveOutcome,
  validateEffects,
  WaitKitConfigError,
  type WaitKitEffects,
} from '@waitkit/core';
import type { DefaultBodyType, HttpResponseResolver, PathParams } from 'msw';

export interface WithWaitKitOptions {
  /** Random source for delay ranges and rates. Defaults to `Math.random`. */
  random?: () => number;
}

/**
 * Wraps an MSW HTTP resolver with Waitkit effects. The wrapped resolver waits for
 * `delay`, then rejects for `timeout`, returns the simulated `error` response, or calls
 * the original resolver. Aborting the request cancels any pending wait.
 *
 * URL and method matching stay with MSW (`http.get(path, ...)`), so only effects are
 * accepted here. Supports MSW 2 and 3.
 */
export function withWaitKit<
  Params extends PathParams<keyof Params> = PathParams,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  ResponseBodyType extends DefaultBodyType = DefaultBodyType,
>(
  effects: WaitKitEffects,
  resolver: HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>,
  options: WithWaitKitOptions = {},
): HttpResponseResolver<Params, RequestBodyType, ResponseBodyType> {
  const issues = validateEffects(effects, 'withWaitKit');
  if (issues.length > 0) {
    throw new WaitKitConfigError(issues);
  }

  return (info) => {
    const { request } = info;
    const result = applyOutcome(resolveOutcome(effects, options), {
      request: { method: request.method, url: request.url },
      signal: request.signal,
      passthrough: () => resolver(info),
    });

    // A simulated error is a plain `Response` whose body deliberately does not match
    // `ResponseBodyType`, which MSW's strict response typing cannot express.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return result as ReturnType<HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>>;
  };
}
