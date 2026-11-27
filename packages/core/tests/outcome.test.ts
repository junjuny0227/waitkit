import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyOutcome, resolveOutcome, sleep, WaitKitTimeoutError } from '../src';

const always = (value: number) => () => value;

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveOutcome', () => {
  it('passes through when no effect triggers', () => {
    expect(resolveOutcome({})).toEqual({ kind: 'passthrough', delayMs: 0 });
  });

  it('uses a fixed delay as-is', () => {
    expect(resolveOutcome({ delay: 250 })).toEqual({ kind: 'passthrough', delayMs: 250 });
  });

  it('picks an integer inside an inclusive delay range', () => {
    expect(resolveOutcome({ delay: [200, 400] }, { random: always(0) }).delayMs).toBe(200);
    expect(resolveOutcome({ delay: [200, 400] }, { random: always(0.5) }).delayMs).toBe(300);
    expect(resolveOutcome({ delay: [200, 400] }, { random: always(0.9999) }).delayMs).toBe(400);
  });

  it('triggers an error with rate 1 by default', () => {
    expect(resolveOutcome({ error: { status: 503 } })).toMatchObject({
      kind: 'error',
      response: expect.objectContaining({ status: 503 }),
    });
  });

  it('uses status 500 and an empty body by default', async () => {
    const outcome = resolveOutcome({ error: {} });

    if (outcome.kind !== 'error') throw new Error('expected error');
    expect(outcome.response.status).toBe(500);
    expect(await outcome.response.text()).toBe('');
  });

  it('applies the error rate against the random source', () => {
    expect(resolveOutcome({ error: { rate: 0.3 } }, { random: always(0.29) }).kind).toBe('error');
    expect(resolveOutcome({ error: { rate: 0.3 } }, { random: always(0.3) }).kind).toBe(
      'passthrough',
    );
    expect(resolveOutcome({ error: { rate: 0 } }, { random: always(0) }).kind).toBe('passthrough');
  });

  it('checks timeout before error', () => {
    const outcome = resolveOutcome({ timeout: { ms: 10 }, error: {} });
    expect(outcome).toEqual({ kind: 'timeout', delayMs: 0, timeoutMs: 10 });
  });

  it('defaults the timeout to 30 seconds', () => {
    expect(resolveOutcome({ timeout: {} })).toEqual({
      kind: 'timeout',
      delayMs: 0,
      timeoutMs: 30_000,
    });
  });

  it('serializes object bodies as JSON without overriding content-type', async () => {
    const json = resolveOutcome({ error: { body: { message: 'boom' } } });
    const problem = resolveOutcome({
      error: { headers: { 'content-type': 'application/problem+json' }, body: { title: 'x' } },
    });

    if (json.kind !== 'error' || problem.kind !== 'error') throw new Error('expected error');
    expect(json.response.headers.get('content-type')).toBe('application/json');
    expect(await json.response.json()).toEqual({ message: 'boom' });
    expect(problem.response.headers.get('content-type')).toBe('application/problem+json');
  });

  it('sends string and binary bodies as-is', async () => {
    const text = resolveOutcome({ error: { body: 'Bad Gateway', statusText: 'Bad Gateway' } });
    const bytes = resolveOutcome({ error: { body: new Uint8Array([1, 2, 3]) } });

    if (text.kind !== 'error' || bytes.kind !== 'error') throw new Error('expected error');
    expect(await text.response.text()).toBe('Bad Gateway');
    expect(text.response.statusText).toBe('Bad Gateway');
    expect(new Uint8Array(await bytes.response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('creates a fresh response for every call', () => {
    const effects = { error: { body: { a: 1 } } };
    const first = resolveOutcome(effects);
    const second = resolveOutcome(effects);

    if (first.kind !== 'error' || second.kind !== 'error') throw new Error('expected error');
    expect(first.response).not.toBe(second.response);
  });
});

describe('applyOutcome', () => {
  const request = { method: 'GET', url: 'http://localhost/api' };

  it('waits for the delay, then passes through', async () => {
    vi.useFakeTimers();
    const passthrough = vi.fn(() => 'real');
    const onDelayStart = vi.fn();
    const onDelayEnd = vi.fn();

    const promise = applyOutcome(
      { kind: 'passthrough', delayMs: 300 },
      { request, passthrough, onDelayStart, onDelayEnd },
    );

    expect(onDelayStart).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(299);
    expect(passthrough).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toBe('real');
    expect(onDelayEnd).toHaveBeenCalledOnce();
  });

  it('returns the simulated response and reports an error', async () => {
    const response = new Response(null, { status: 418 });
    const onError = vi.fn();

    const result = await applyOutcome(
      { kind: 'error', delayMs: 0, response },
      { request, passthrough: vi.fn(), onError },
    );

    expect(result).toBe(response);
    expect(onError.mock.calls[0]?.[0].message).toBe(
      'WaitKit simulated 418 response for GET http://localhost/api.',
    );
  });

  it('rejects with WaitKitTimeoutError after the timeout', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    const promise = applyOutcome(
      { kind: 'timeout', delayMs: 0, timeoutMs: 1000 },
      { request, passthrough: vi.fn(), onError },
    );
    promise.catch(() => {}); // asserted below, after the timers run

    expect(onError).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).rejects.toThrow(
      new WaitKitTimeoutError('WaitKit timed out GET http://localhost/api after 1000ms.', 1000),
    );
  });

  it('rejects with the abort reason when the signal aborts during the delay', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const passthrough = vi.fn();

    const promise = applyOutcome(
      { kind: 'passthrough', delayMs: 5000 },
      { request, passthrough, signal: controller.signal },
    );
    promise.catch(() => {}); // asserted below, after the timers run

    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(passthrough).not.toHaveBeenCalled();
  });
});

describe('sleep', () => {
  it('rejects immediately for an already aborted signal', async () => {
    const reason = new Error('stop');
    await expect(sleep(1000, AbortSignal.abort(reason))).rejects.toBe(reason);
  });
});
