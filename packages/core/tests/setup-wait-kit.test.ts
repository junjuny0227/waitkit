import { afterEach, describe, expect, it, vi } from 'vitest';

import { setupWaitKit, WaitKitTimeoutError } from '../src';

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('setupWaitKit', () => {
  it('passes unmatched requests through to the original fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/users', delay: 1000 }],
    });

    await fetch('/api/posts');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('delays matched requests before calling the original fetch', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/users', delay: 1000 }],
    });

    const promise = fetch('/api/users');

    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns simulated error responses', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: '/api/payment',
          errorRate: 1,
          errorResponse: {
            status: 503,
            body: { message: 'Unavailable' },
          },
        },
      ],
    });

    const response = await fetch('/api/payment');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: 'Unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses errorRate as a probability threshold', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.25).mockReturnValueOnce(0.75);
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: '/api/payment',
          errorRate: 0.5,
          errorResponse: { status: 503 },
        },
      ],
    });

    expect((await fetch('/api/payment')).status).toBe(503);
    expect((await fetch('/api/payment')).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws timeout errors after timeoutMs', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/report', timeoutRate: 1, timeoutMs: 5000 }],
    });

    const promise = fetch('/api/report');
    const expectation = expect(promise).rejects.toBeInstanceOf(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(5000);

    await expectation;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('waits for delay before starting timeout simulation', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/report', delay: 500, timeoutRate: 1, timeoutMs: 1000 }],
      onError,
    });

    const promise = fetch('/api/report');
    const expectation = expect(promise).rejects.toBeInstanceOf(WaitKitTimeoutError);

    await vi.advanceTimersByTimeAsync(499);
    expect(onError).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onError).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    await expectation;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses timeoutRate as a probability threshold', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.25).mockReturnValueOnce(0.75);
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/report', timeoutRate: 0.5, timeoutMs: 1000 }],
    });

    const timeoutPromise = fetch('/api/report');
    const expectation = expect(timeoutPromise).rejects.toBeInstanceOf(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await expectation;

    expect((await fetch('/api/report')).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cancel simulated delay when the request signal aborts', async () => {
    vi.useFakeTimers();
    const abortController = new AbortController();
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [{ url: '/api/users', delay: 100 }],
    });

    const promise = fetch('/api/users', { signal: abortController.signal });
    abortController.abort();

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toHaveProperty('status', 200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('applies the first matching rule when multiple rules match', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: '/api/users',
          errorRate: 1,
          errorResponse: { status: 503 },
        },
        {
          url: '/api',
          errorRate: 1,
          errorResponse: { status: 418 },
        },
      ],
    });

    const response = await fetch('/api/users');

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('can disable, enable, and restore the interceptor', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({
      rules: [
        {
          url: '/api/users',
          errorRate: 1,
          errorResponse: { status: 500 },
        },
      ],
    });

    controller.disable();
    const disabledResponse = await fetch('/api/users');
    expect(disabledResponse.status).toBe(200);

    controller.enable();
    const enabledResponse = await fetch('/api/users');
    expect(enabledResponse.status).toBe(500);

    controller.restore();
    expect(globalThis.fetch).toBe(fetchMock);
  });

  it('can enable the interceptor again after restore', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({
      rules: [
        {
          url: '/api/users',
          errorRate: 1,
          errorResponse: { status: 500 },
        },
      ],
    });

    controller.restore();
    expect((await fetch('/api/users')).status).toBe(200);

    controller.enable();
    expect((await fetch('/api/users')).status).toBe(500);
  });

  it('switches scenarios at runtime', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({
      activeScenario: 'server-error',
      rules: [
        {
          url: '/api/users',
          errorRate: 1,
          errorResponse: { status: 400 },
        },
      ],
      scenarios: {
        'server-error': [
          {
            url: '/api/users',
            errorRate: 1,
            errorResponse: { status: 500 },
          },
        ],
      },
    });

    expect((await fetch('/api/users')).status).toBe(500);

    controller.resetScenario();
    expect((await fetch('/api/users')).status).toBe(400);

    controller.setScenario('server-error');
    expect(controller.getScenario()).toBe('server-error');
  });

  it('emits scenario change events when scenarios change at runtime', () => {
    const onScenarioChange = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      activeScenario: 'server-error',
      scenarios: {
        'server-error': [{ url: '/api/users', errorRate: 1 }],
        'slow-network': [{ url: '/api/users', delay: 1000 }],
      },
      onScenarioChange,
    });

    expect(onScenarioChange).not.toHaveBeenCalled();

    controller.setScenario('slow-network');
    expect(onScenarioChange).toHaveBeenCalledWith({
      previousScenario: 'server-error',
      scenario: 'slow-network',
      reason: 'setScenario',
    });

    controller.resetScenario();
    expect(onScenarioChange).toHaveBeenLastCalledWith({
      previousScenario: 'slow-network',
      scenario: undefined,
      reason: 'resetScenario',
    });
    expect(onScenarioChange).toHaveBeenCalledTimes(2);
  });

  it('does not emit scenario change events for scenario no-ops', () => {
    const onScenarioChange = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      activeScenario: 'server-error',
      scenarios: {
        'server-error': [{ url: '/api/users', errorRate: 1 }],
      },
      onScenarioChange,
    });

    controller.setScenario('server-error');
    expect(onScenarioChange).not.toHaveBeenCalled();

    controller.resetScenario();
    expect(onScenarioChange).toHaveBeenCalledTimes(1);

    controller.resetScenario();
    expect(onScenarioChange).toHaveBeenCalledTimes(1);
  });

  it('does not emit scenario change events when setScenario fails', () => {
    const onScenarioChange = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      scenarios: {
        'server-error': [{ url: '/api/users', errorRate: 1 }],
      },
      onScenarioChange,
    });

    expect(() => controller.setScenario('missing')).toThrow(
      'WaitKit scenario "missing" does not exist.',
    );
    expect(onScenarioChange).not.toHaveBeenCalled();
  });

  it('emits request, match, delay, and error events', async () => {
    vi.useFakeTimers();
    const onRequest = vi.fn();
    const onMatch = vi.fn();
    const onDelayStart = vi.fn();
    const onDelayEnd = vi.fn();
    const onError = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    setupWaitKit({
      rules: [
        {
          url: '/api/users',
          delay: 100,
          errorRate: 1,
          errorResponse: { status: 500 },
        },
      ],
      onRequest,
      onMatch,
      onDelayStart,
      onDelayEnd,
      onError,
    });

    const promise = fetch('/api/users');
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onMatch).toHaveBeenCalledTimes(1);
    expect(onDelayStart).toHaveBeenCalledTimes(1);
    expect(onDelayEnd).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('includes debugging context in error events', async () => {
    const onError = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    setupWaitKit({
      activeScenario: 'server-error',
      scenarios: {
        'server-error': [
          {
            url: '/api/users',
            delay: 25,
            errorRate: 1,
            errorResponse: { status: 500 },
          },
        ],
      },
      onError,
    });

    await fetch('/api/users');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
        scenario: 'server-error',
        delayMs: 25,
        error: expect.any(Error),
      }),
    );
  });
});
