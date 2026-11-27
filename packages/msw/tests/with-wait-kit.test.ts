import { WaitKitConfigError, WaitKitTimeoutError } from '@waitkit/core';
import { HttpResponse, http } from 'msw/http';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { withWaitKit } from '../src';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

const ok = () => HttpResponse.json({ ok: true });

describe('withWaitKit (실제 MSW 서버)', () => {
  it('효과가 없으면 원래 resolver 응답을 그대로 돌려준다', async () => {
    server.use(http.get('http://api.test/users', withWaitKit({}, ok)));

    const response = await fetch('http://api.test/users');

    expect(await response.json()).toEqual({ ok: true });
  });

  it('delay 동안 기다린 뒤 resolver를 호출한다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const resolver = vi.fn(ok);
    server.use(http.get('http://api.test/users', withWaitKit({ delay: 300 }, resolver)));

    const promise = fetch('http://api.test/users');
    await vi.advanceTimersByTimeAsync(299);
    expect(resolver).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect((await promise).status).toBe(200);
    expect(resolver).toHaveBeenCalledOnce();
  });

  it('error 효과는 resolver를 호출하지 않고 시뮬레이션 응답을 돌려준다', async () => {
    const resolver = vi.fn(ok);
    server.use(
      http.get(
        'http://api.test/users',
        withWaitKit(
          {
            error: {
              status: 429,
              statusText: 'Too Many Requests',
              headers: { 'retry-after': '5' },
              body: { message: 'slow down' },
            },
          },
          resolver,
        ),
      ),
    );

    const response = await fetch('http://api.test/users');

    expect(response.status).toBe(429);
    expect(response.statusText).toBe('Too Many Requests');
    expect(response.headers.get('retry-after')).toBe('5');
    expect(await response.json()).toEqual({ message: 'slow down' });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('error rate는 주입한 random으로 결정된다', async () => {
    server.use(
      http.get(
        'http://api.test/a',
        withWaitKit({ error: { rate: 0.5 } }, ok, { random: () => 0.9 }),
      ),
      http.get(
        'http://api.test/b',
        withWaitKit({ error: { rate: 0.5 } }, ok, { random: () => 0.1 }),
      ),
    );

    expect((await fetch('http://api.test/a')).status).toBe(200);
    expect((await fetch('http://api.test/b')).status).toBe(500);
  });
});

describe('withWaitKit (resolver 직접 호출)', () => {
  type Info = Parameters<ReturnType<typeof withWaitKit>>[0];

  // MSW가 넘기는 info 중 Waitkit이 읽는 것은 request뿐이다.
  const info = (method = 'GET', url = 'http://api.test/orders', signal?: AbortSignal): Info =>
    ({
      request: new Request(url, signal === undefined ? { method } : { method, signal }),
      requestId: 'test',
      params: {},
      cookies: {},
    }) as unknown as Info;

  it('timeout 효과는 지정한 시간 뒤 WaitKitTimeoutError로 reject한다', async () => {
    vi.useFakeTimers();
    const wrapped = withWaitKit({ timeout: { ms: 1000 } }, vi.fn());

    const promise = Promise.resolve(wrapped(info('POST')));
    promise.catch(() => {}); // asserted below, after the timers run
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).rejects.toThrow(
      new WaitKitTimeoutError('WaitKit timed out POST http://api.test/orders after 1000ms.', 1000),
    );
  });

  it('request가 abort되면 대기를 멈추고 abort reason으로 reject한다', async () => {
    vi.useFakeTimers();
    const abort = new AbortController();
    const resolver = vi.fn(ok);
    const wrapped = withWaitKit({ delay: 10_000 }, resolver);

    const promise = Promise.resolve(wrapped(info('GET', 'http://api.test/orders', abort.signal)));
    promise.catch(() => {}); // asserted below, after the timers run
    abort.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('resolver에 info를 그대로 넘기고, resolver 에러를 그대로 전파한다', async () => {
    const resolver = vi.fn(() => {
      throw new Error('resolver failed');
    });
    const wrapped = withWaitKit({}, resolver);
    const input = info();

    await expect(Promise.resolve(wrapped(input))).rejects.toThrow('resolver failed');
    expect(resolver).toHaveBeenCalledWith(input);
  });

  it('잘못된 효과는 감쌀 때 WaitKitConfigError로 알려준다', () => {
    let thrown: unknown;
    try {
      withWaitKit({ delay: -1, errorRate: 1 } as never, ok);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WaitKitConfigError);
    expect((thrown as WaitKitConfigError).issues.map((issue) => issue.path)).toEqual([
      'withWaitKit.errorRate',
      'withWaitKit.delay',
    ]);
  });

  it('MSW 핸들러에 넣었을 때 resolver 인자 타입이 추론된다', () => {
    http.get(
      'http://api.test/typed/:id',
      withWaitKit({ delay: 1 }, ({ request, params }) => {
        expectTypeOf(request).toExtend<Request>();
        expectTypeOf(params.id).toEqualTypeOf<string | readonly string[] | undefined>();
        return HttpResponse.json({ id: params.id });
      }),
    );
  });
});
