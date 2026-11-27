import { act, cleanup, fireEvent, render, renderHook, within } from '@testing-library/react';
import { setupWaitKit, type WaitKitConfig, type WaitKitController } from '@waitkit/core';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWaitKit, useWaitKitEvent, WaitKitDevTools, WaitKitProvider } from '../src';

const realFetch = globalThis.fetch;
let controller: WaitKitController;

const config = {
  rules: [{ url: '/api/fast', delay: 0 }],
  scenarios: {
    slow: [{ url: '/api/*', delay: 100 }],
    broken: [{ url: '/api/*', error: { status: 503 } }],
    hang: [{ url: '/api/*', timeout: { ms: 50 } }],
  },
} satisfies WaitKitConfig;

beforeEach(() => {
  globalThis.fetch = vi.fn<typeof fetch>(async () => new Response('network'));
  controller = setupWaitKit(config);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  controller.dispose();
  globalThis.fetch = realFetch;
  vi.useRealTimers();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <WaitKitProvider controller={controller}>{children}</WaitKitProvider>
);

describe('useWaitKit', () => {
  it('throws outside of WaitKitProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useWaitKit())).toThrow(
      'Waitkit hooks must be used inside <WaitKitProvider>.',
    );
  });

  it('exposes state, scenario names, and actions', () => {
    const { result } = renderHook(() => useWaitKit(), { wrapper });

    expect(result.current).toMatchObject({
      enabled: true,
      scenario: undefined,
      disposed: false,
      scenarios: ['slow', 'broken', 'hang'],
      controller,
    });
  });

  it('re-renders when the controller is changed directly', () => {
    const { result } = renderHook(() => useWaitKit(), { wrapper });

    act(() => controller.setScenario('broken'));
    expect(result.current.scenario).toBe('broken');

    act(() => controller.disable());
    expect(result.current.enabled).toBe(false);

    act(() => controller.dispose());
    expect(result.current.disposed).toBe(true);
  });

  it('keeps the same result object while nothing changes', () => {
    const { result, rerender } = renderHook(() => useWaitKit(), { wrapper });
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });
});

describe('useWaitKitEvent', () => {
  it('calls the latest listener and unsubscribes on unmount', async () => {
    const calls: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ tag }: { tag: string }) =>
        useWaitKitEvent('request', (event) => calls.push(`${tag}:${event.url}`)),
      { wrapper, initialProps: { tag: 'a' } },
    );

    await fetch('/one');
    rerender({ tag: 'b' });
    await fetch('/two');
    unmount();
    await fetch('/three');

    expect(calls).toEqual(['a:http://localhost:3000/one', 'b:http://localhost:3000/two']);
  });
});

/** The panel renders into a shadow root; query inside it like a user would see it. */
function panel() {
  const host = document.querySelector('waitkit-devtools');
  if (host?.shadowRoot == null) throw new Error('devtools host not mounted');
  return within(host.shadowRoot as unknown as HTMLElement);
}

const rows = () => panel().queryAllByRole('listitem');

describe('WaitKitDevTools', () => {
  it('renders into a shadow root attached to the body and removes it on unmount', () => {
    const { unmount } = render(<WaitKitDevTools />, { wrapper });

    const host = document.querySelector('waitkit-devtools');
    expect(host?.parentElement).toBe(document.body);
    expect(host?.shadowRoot?.querySelector('style')?.textContent).toContain('--wk-surface');
    expect(panel().getByRole('complementary', { name: 'Waitkit devtools' })).toBeTruthy();

    unmount();
    expect(document.querySelector('waitkit-devtools')).toBeNull();
  });

  it('switches simulation on and off and explains the off state', () => {
    render(<WaitKitDevTools />, { wrapper });
    const toggle = panel().getByRole('switch', { name: 'Simulate' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    expect(controller.getState().enabled).toBe(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(
      panel().getByText('Simulation is off. Requests go straight to the network.'),
    ).toBeTruthy();

    fireEvent.click(toggle);
    expect(controller.getState().enabled).toBe(true);
    expect(panel().queryByText(/Simulation is off/)).toBeNull();
  });

  it('switches scenarios and back to the base rules', () => {
    render(<WaitKitDevTools />, { wrapper });
    const group = within(panel().getByRole('group', { name: 'Scenario' }));

    expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'base',
      'slow',
      'broken',
      'hang',
    ]);

    fireEvent.click(group.getByRole('button', { name: 'broken' }));
    expect(controller.getState().scenario).toBe('broken');
    expect(group.getByRole('button', { name: 'broken' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(group.getByRole('button', { name: 'base' }));
    expect(controller.getState().scenario).toBeUndefined();
  });

  it('reflects scenario changes made outside the panel', () => {
    render(<WaitKitDevTools />, { wrapper });

    act(() => controller.setScenario('slow'));

    expect(panel().getByRole('button', { name: 'slow' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows waiting requests with remaining time, then how each one ended', async () => {
    vi.useFakeTimers();
    render(<WaitKitDevTools />, { wrapper });
    expect(panel().getByText(/No simulated requests yet/)).toBeTruthy();

    act(() => controller.setScenario('slow'));
    let pending!: Promise<Response>;
    act(() => {
      pending = fetch('/api/posts?page=2', { method: 'POST' });
    });

    expect(rows().map((row) => row.textContent)).toEqual(['POST/api/posts?page=2waiting 100ms']);
    expect(panel().getByText('Activity · 1 waiting')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
      await pending;
    });
    expect(rows().map((row) => row.textContent)).toEqual(['POST/api/posts?page=2+100ms']);

    act(() => controller.setScenario('broken'));
    await act(() => fetch('/api/users'));

    act(() => controller.setScenario('hang'));
    let hanging!: Promise<unknown>;
    act(() => {
      hanging = fetch('/api/hang').catch(() => undefined);
    });
    expect(rows()[0]?.textContent).toBe('GET/api/hanghanging 50ms');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
      await hanging;
    });

    expect(rows().map((row) => row.textContent)).toEqual([
      'GET/api/hangtimeout 50ms',
      'GET/api/users503',
      'POST/api/posts?page=2+100ms',
    ]);
    expect(rows()[0]?.title).toBe('http://localhost:3000/api/hang');

    fireEvent.click(panel().getByRole('button', { name: 'Clear' }));
    expect(rows()).toHaveLength(0);
  });

  it('marks requests aborted while waiting', async () => {
    vi.useFakeTimers();
    render(<WaitKitDevTools />, { wrapper });
    act(() => controller.setScenario('slow'));
    const abort = new AbortController();

    await act(async () => {
      const pending = fetch('/api/slow', { signal: abort.signal }).catch(() => undefined);
      abort.abort();
      await pending;
    });

    expect(rows()[0]?.textContent).toBe('GET/api/slowaborted');
  });

  it('keeps at most maxLogEntries entries', async () => {
    render(<WaitKitDevTools maxLogEntries={2} />, { wrapper });
    act(() => controller.setScenario('broken'));

    for (const path of ['/api/1', '/api/2', '/api/3']) {
      await act(() => fetch(path));
    }

    expect(rows().map((row) => row.title)).toEqual([
      'http://localhost:3000/api/3',
      'http://localhost:3000/api/2',
    ]);
  });

  it('collapses to a launcher that shows state and remembers it', () => {
    const { unmount } = render(<WaitKitDevTools />, { wrapper });

    fireEvent.click(panel().getByRole('button', { name: 'Collapse Waitkit devtools' }));
    act(() => controller.setScenario('broken'));
    const launcher = panel().getByRole('button', { name: /Open Waitkit devtools/ });

    expect(launcher.getAttribute('aria-label')).toBe('Open Waitkit devtools (on, scenario broken)');
    expect(panel().queryByRole('switch')).toBeNull();
    unmount();

    render(<WaitKitDevTools />, { wrapper });
    expect(panel().getByRole('button', { name: /Open Waitkit devtools/ })).toBeTruthy();

    fireEvent.click(panel().getByRole('button', { name: /Open Waitkit devtools/ }));
    expect(panel().getByRole('switch', { name: 'Simulate' })).toBeTruthy();
  });

  it('toggles with the keyboard shortcut', () => {
    render(<WaitKitDevTools shortcut="alt+shift+w" />, { wrapper });

    fireEvent.keyDown(window, { code: 'KeyW', altKey: true, shiftKey: true });
    expect(panel().getByRole('button', { name: /Open Waitkit devtools/ })).toBeTruthy();

    fireEvent.keyDown(window, { code: 'KeyW', altKey: true });
    expect(panel().queryByRole('switch')).toBeNull();

    fireEvent.keyDown(window, { code: 'KeyW', altKey: true, shiftKey: true });
    expect(panel().getByRole('switch')).toBeTruthy();
  });

  it('applies the chosen theme and position', () => {
    render(<WaitKitDevTools theme="light" position="top-left" />, { wrapper });
    const aside = panel().getByRole('complementary');

    expect(aside.dataset.theme).toBe('light');
    expect(aside.dataset.position).toBe('top-left');
  });

  it('renders nothing once the controller is disposed', () => {
    render(<WaitKitDevTools />, { wrapper });

    act(() => controller.dispose());

    expect(document.querySelector('waitkit-devtools')).toBeNull();
  });
});
