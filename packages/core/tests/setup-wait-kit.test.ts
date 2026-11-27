import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WaitKitController, WaitKitEventMap } from '../src';
import { setupWaitKit, WaitKitConfigError, WaitKitTimeoutError } from '../src';

const realFetch = globalThis.fetch;
let networkFetch: ReturnType<typeof vi.fn<typeof fetch>>;
let controller: WaitKitController | undefined;

beforeEach(() => {
  networkFetch = vi.fn<typeof fetch>(async () => new Response('network', { status: 200 }));
  globalThis.fetch = networkFetch;
});

afterEach(() => {
  controller?.dispose();
  controller = undefined;
  globalThis.fetch = realFetch;
  vi.useRealTimers();
});

function setup(...args: Parameters<typeof setupWaitKit>): WaitKitController {
  controller = setupWaitKit(...args);
  return controller;
}

function record<K extends keyof WaitKitEventMap>(c: WaitKitController, type: K) {
  const events: WaitKitEventMap[K][] = [];
  c.on(type, (event) => events.push(event));
  return events;
}

describe('setupWaitKit', () => {
  it('throws a WaitKitConfigError listing every issue', () => {
    let thrown: unknown;
    try {
      setupWaitKit({ rules: [{ url: '', delay: -1 }] });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WaitKitConfigError);
    expect((thrown as WaitKitConfigError).issues.map((issue) => issue.path)).toEqual([
      'rules[0].url',
      'rules[0].delay',
    ]);
    expect((thrown as Error).message).toContain('rules[0].url: must not be empty');
  });

  it('does not patch fetch when the config is invalid', () => {
    expect(() => setupWaitKit({ rules: [{ url: '/a', delay: -1 }] })).toThrow(
      'Invalid Waitkit config',
    );
    expect(globalThis.fetch).toBe(networkFetch);
  });

  it('passes unmatched requests to the original fetch with the same arguments', async () => {
    setup({ rules: [{ url: '/api/users', error: {} }] });
    const init = { method: 'POST', body: 'x' };

    const response = await fetch('/api/posts', init);

    expect(await response.text()).toBe('network');
    expect(networkFetch).toHaveBeenCalledWith('/api/posts', init);
  });

  it('returns the simulated error response without calling the network', async () => {
    setup({ rules: [{ url: '/api/users', error: { status: 503, body: { message: 'down' } } }] });

    const response = await fetch('/api/users');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: 'down' });
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('delays matched requests and then calls the network', async () => {
    vi.useFakeTimers();
    setup({ rules: [{ url: '/api/*', delay: 500 }] });

    const promise = fetch('/api/users');
    await vi.advanceTimersByTimeAsync(499);
    expect(networkFetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect((await promise).status).toBe(200);
  });

  it('rejects with WaitKitTimeoutError after the timeout', async () => {
    vi.useFakeTimers();
    setup({ rules: [{ url: '/api/*', timeout: { ms: 3000 } }] });

    const promise = fetch('/api/users');
    promise.catch(() => {}); // asserted below, after the timers run
    await vi.advanceTimersByTimeAsync(3000);
    await expect(promise).rejects.toBeInstanceOf(WaitKitTimeoutError);
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('rejects with the abort reason when the request is aborted while waiting', async () => {
    vi.useFakeTimers();
    setup({ rules: [{ url: '*', delay: 10_000 }] });
    const abort = new AbortController();

    const promise = fetch('/api/users', { signal: abort.signal });
    promise.catch(() => {}); // asserted below, after the timers run
    abort.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('respects the signal of a Request input', async () => {
    vi.useFakeTimers();
    setup({ rules: [{ url: '*', timeout: {} }] });
    const abort = new AbortController();

    const promise = fetch(new Request('http://localhost/api', { signal: abort.signal }));
    promise.catch(() => {}); // asserted below, after the timers run
    abort.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('uses the injected random source', async () => {
    setup({ rules: [{ url: '*', error: { rate: 0.5 } }] }, { random: () => 0.9 });
    expect((await fetch('/a')).status).toBe(200);

    setup({ rules: [{ url: '*', error: { rate: 0.5 } }] }, { random: () => 0.1 });
    expect((await fetch('/a')).status).toBe(500);
  });

  it('logs simulated requests when debug is on', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    setup({ rules: [{ url: '*', error: { status: 502 } }] }, { debug: true });

    await fetch('/api');

    expect(info).toHaveBeenCalledWith('[waitkit] GET http://localhost/api → error (+0ms)');
  });
});

describe('scenarios', () => {
  const config = {
    rules: [{ url: '/api/*', delay: 0, error: { status: 400 } }],
    scenarios: {
      broken: [{ url: '/api/*', error: { status: 500 } }],
      offline: [{ url: '*', error: { status: 503 } }],
    },
  };

  it('replaces the base rules while a scenario is active', async () => {
    const c = setup(config);
    expect((await fetch('/api/a')).status).toBe(400);

    c.setScenario('broken');
    expect((await fetch('/api/a')).status).toBe(500);

    c.resetScenario();
    expect((await fetch('/api/a')).status).toBe(400);
  });

  it('starts with config.scenario and lists scenario names in order', () => {
    const c = setup({ ...config, scenario: 'offline' });
    expect(c.getState().scenario).toBe('offline');
    expect(c.scenarios).toEqual(['broken', 'offline']);
  });

  it('throws for an unknown scenario and names the known ones', () => {
    const c = setup(config);
    expect(() => c.setScenario('slow')).toThrow(
      'WaitKit scenario "slow" does not exist. Known scenarios: broken, offline.',
    );
  });
});

describe('controller state and events', () => {
  it('returns the same state object until something changes', () => {
    const c = setup({});
    const first = c.getState();

    expect(c.getState()).toBe(first);
    c.enable();
    expect(c.getState()).toBe(first);
    c.disable();
    expect(c.getState()).not.toBe(first);
    expect(c.getState()).toEqual({ enabled: false, scenario: undefined, disposed: false });
  });

  it('emits change events with previous and current state', () => {
    const c = setup({ scenarios: { slow: [] } });
    const changes = record(c, 'change');

    c.disable();
    c.disable();
    c.setScenario('slow');
    c.resetScenario();
    c.enable();

    expect(changes.map((event) => event.reason)).toEqual([
      'disable',
      'setScenario',
      'resetScenario',
      'enable',
    ]);
    expect(changes[1]?.previous.scenario).toBeUndefined();
    expect(changes[1]?.current.scenario).toBe('slow');
  });

  it('emits request, match, delay, and error events in order', async () => {
    vi.useFakeTimers();
    const c = setup({ rules: [{ url: '/api/*', delay: 100, error: { status: 500 } }] });
    const order: string[] = [];
    for (const type of ['request', 'match', 'delayStart', 'delayEnd', 'error'] as const) {
      c.on(type, () => order.push(type));
    }
    const matches = record(c, 'match');

    const promise = fetch('/api/users', { method: 'post' });
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(order).toEqual(['request', 'match', 'delayStart', 'delayEnd', 'error']);
    expect(matches[0]).toMatchObject({
      url: 'http://localhost/api/users',
      method: 'POST',
      scenario: undefined,
      outcome: { kind: 'error', delayMs: 100 },
    });
  });

  it('emits only request for unmatched requests', async () => {
    const c = setup({ rules: [{ url: '/api/*', error: {} }] });
    const requests = record(c, 'request');
    const matches = record(c, 'match');

    await fetch('/other');

    expect(requests).toHaveLength(1);
    expect(matches).toHaveLength(0);
  });

  it('stops delivering events after unsubscribe', async () => {
    const c = setup({});
    const listener = vi.fn();
    const off = c.on('request', listener);

    off();
    await fetch('/a');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('enable, disable, and dispose', () => {
  it('bypasses rules while disabled', async () => {
    const c = setup({ rules: [{ url: '*', error: {} }] }, { enabled: false });
    const requests = record(c, 'request');

    expect((await fetch('/a')).status).toBe(200);
    expect(requests).toHaveLength(0);

    c.enable();
    expect((await fetch('/a')).status).toBe(500);
  });

  it('restores the original fetch and cannot be re-enabled', () => {
    const c = setup({});
    expect(globalThis.fetch).not.toBe(networkFetch);

    const changes = record(c, 'change');
    c.dispose();

    expect(globalThis.fetch).toBe(networkFetch);
    expect(c.getState()).toEqual({ enabled: false, scenario: undefined, disposed: true });
    expect(changes.map((event) => event.reason)).toEqual(['dispose']);
    expect(() => c.enable()).toThrow('WaitKit controller was disposed');
    expect(() => c.dispose()).not.toThrow();
  });

  it('leaves a fetch patched by someone else in place on dispose', async () => {
    const c = setup({ rules: [{ url: '*', error: {} }] });
    const patched = globalThis.fetch;
    const outer = vi.fn<typeof fetch>((input, init) => patched(input, init));
    globalThis.fetch = outer;

    c.dispose();

    expect(globalThis.fetch).toBe(outer);
    expect((await fetch('/a')).status).toBe(200);
  });

  it('disposes the previous controller when set up again', async () => {
    const first = setup({ rules: [{ url: '*', error: { status: 500 } }] });
    const second = setup({ rules: [{ url: '*', error: { status: 502 } }] });

    expect(first.getState().disposed).toBe(true);
    expect((await fetch('/a')).status).toBe(502);

    second.dispose();
    expect(globalThis.fetch).toBe(networkFetch);
  });
});
