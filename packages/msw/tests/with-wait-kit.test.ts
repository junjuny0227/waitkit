import { WaitKitTimeoutError } from '@waitkit/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { withWaitKit } from '../src';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function makeArgs(method = 'GET', url = 'http://example.com/api/users') {
  return {
    request: new Request(url, { method }),
    params: {},
    cookies: {},
    requestId: 'test-id',
    finalize: vi.fn(),
  };
}

const ok = new Response('ok', { status: 200 });

describe('withWaitKit', () => {
  it('rule이 없으면 resolver를 그대로 호출한다', async () => {
    const resolver = vi.fn().mockResolvedValue(ok);
    const wrapped = withWaitKit({}, resolver);

    const result = await wrapped(makeArgs());

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(result).toBe(ok);
  });

  it('delay가 있으면 resolver 호출 전에 지연된다', async () => {
    vi.useFakeTimers();
    const resolver = vi.fn().mockResolvedValue(ok);
    const wrapped = withWaitKit({ delay: 500 }, resolver);

    const promise = wrapped(makeArgs());

    expect(resolver).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('delay 범위 [min, max]를 처리한다', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const resolver = vi.fn().mockResolvedValue(ok);
    const wrapped = withWaitKit({ delay: [200, 400] }, resolver);

    const promise = wrapped(makeArgs());
    await vi.advanceTimersByTimeAsync(400);
    await promise;

    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('errorRate: 1이면 resolver를 호출하지 않고 errorResponse를 반환한다', async () => {
    const resolver = vi.fn();
    const wrapped = withWaitKit(
      { errorRate: 1, errorResponse: { status: 503, body: { message: 'Unavailable' } } },
      resolver,
    );

    const result = (await wrapped(makeArgs())) as Response;

    expect(resolver).not.toHaveBeenCalled();
    expect(result.status).toBe(503);
    const json = await result.json();
    expect(json).toEqual({ message: 'Unavailable' });
  });

  it('errorRate: 1이면 기본 500 응답을 반환한다', async () => {
    const resolver = vi.fn();
    const wrapped = withWaitKit({ errorRate: 1 }, resolver);

    const result = (await wrapped(makeArgs())) as Response;

    expect(result.status).toBe(500);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('errorRate: 0이면 resolver를 호출한다', async () => {
    const resolver = vi.fn().mockResolvedValue(ok);
    const wrapped = withWaitKit({ errorRate: 0 }, resolver);

    await wrapped(makeArgs());

    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('timeoutRate: 1이면 WaitKitTimeoutError를 throw한다', async () => {
    vi.useFakeTimers();
    const resolver = vi.fn();
    const wrapped = withWaitKit({ timeoutRate: 1, timeoutMs: 3000 }, resolver);

    const promise = wrapped(makeArgs());
    const assertion = expect(promise).rejects.toThrow(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(3000);
    await assertion;

    expect(resolver).not.toHaveBeenCalled();
  });

  it('timeoutMs 미지정이면 기본값 30초로 timeout된다', async () => {
    vi.useFakeTimers();
    const resolver = vi.fn();
    const wrapped = withWaitKit({ timeoutRate: 1 }, resolver);

    const promise = wrapped(makeArgs());
    const assertion = expect(promise).rejects.toThrow(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
  });

  it('timeoutRate: 0이면 resolver를 호출한다', async () => {
    const resolver = vi.fn().mockResolvedValue(ok);
    const wrapped = withWaitKit({ timeoutRate: 0 }, resolver);

    await wrapped(makeArgs());

    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('delay 후 errorRate를 평가한다', async () => {
    vi.useFakeTimers();
    const resolver = vi.fn();
    const wrapped = withWaitKit({ delay: 200, errorRate: 1 }, resolver);

    const promise = wrapped(makeArgs());
    await vi.advanceTimersByTimeAsync(200);
    const result = (await promise) as Response;

    expect(result.status).toBe(500);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('delay 후 timeoutRate를 평가한다', async () => {
    vi.useFakeTimers();
    const resolver = vi.fn();
    const wrapped = withWaitKit({ delay: 100, timeoutRate: 1, timeoutMs: 2000 }, resolver);

    const promise = wrapped(makeArgs());
    const assertion = expect(promise).rejects.toThrow(WaitKitTimeoutError);
    await vi.advanceTimersByTimeAsync(2100);
    await assertion;

    expect(resolver).not.toHaveBeenCalled();
  });

  it('resolver가 throw하면 에러가 그대로 전파된다', async () => {
    const resolver = vi.fn().mockRejectedValue(new Error('resolver failed'));
    const wrapped = withWaitKit({}, resolver);

    await expect(wrapped(makeArgs())).rejects.toThrow('resolver failed');
  });
});
