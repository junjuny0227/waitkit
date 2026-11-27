import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
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

describe('WaitKitDevTools', () => {
  it('toggles enabled state', () => {
    render(<WaitKitDevTools />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(controller.getState().enabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Off' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    expect(controller.getState().enabled).toBe(true);
  });

  it('switches scenarios and back to the base rules', () => {
    render(<WaitKitDevTools />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'broken' }));
    expect(controller.getState().scenario).toBe('broken');
    expect(screen.getByRole('button', { name: 'broken' }).getAttribute('aria-pressed')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'base' }));
    expect(controller.getState().scenario).toBeUndefined();
  });

  it('reflects scenario changes made outside the panel', () => {
    render(<WaitKitDevTools />, { wrapper });

    act(() => controller.setScenario('slow'));

    expect(screen.getByRole('button', { name: 'slow' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('logs simulated requests with their outcome, newest first, and can clear them', async () => {
    vi.useFakeTimers();
    render(<WaitKitDevTools />, { wrapper });
    expect(screen.getByText('no simulated requests yet')).toBeTruthy();

    act(() => controller.setScenario('broken'));
    await act(() => fetch('/api/users'));
    act(() => controller.setScenario('slow'));
    await act(async () => {
      const pending = fetch('/api/posts', { method: 'POST' });
      await vi.advanceTimersByTimeAsync(100);
      await pending;
    });
    act(() => controller.setScenario('hang'));
    await act(async () => {
      const pending = fetch('/api/hang').catch(() => undefined);
      await vi.advanceTimersByTimeAsync(50);
      await pending;
    });

    const entries = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(entries).toEqual([
      'timeout 50ms GET http://localhost:3000/api/hang',
      'delay POST http://localhost:3000/api/posts +100ms',
      'error 503 GET http://localhost:3000/api/users',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('keeps at most maxLogEntries entries', async () => {
    render(<WaitKitDevTools maxLogEntries={2} />, { wrapper });
    act(() => controller.setScenario('broken'));

    for (const path of ['/api/1', '/api/2', '/api/3']) {
      await act(() => fetch(path));
    }

    expect(screen.getAllByRole('listitem').map((item) => item.title)).toEqual([
      'http://localhost:3000/api/3',
      'http://localhost:3000/api/2',
    ]);
  });

  it('collapses and expands the panel', () => {
    render(<WaitKitDevTools defaultOpen={false} />, { wrapper });
    const header = screen.getByRole('button', { name: /Waitkit/ });

    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'On' })).toBeNull();

    fireEvent.click(header);
    expect(screen.getByRole('button', { name: 'On' })).toBeTruthy();
  });

  it('renders nothing once the controller is disposed', () => {
    render(<WaitKitDevTools />, { wrapper });
    expect(screen.getByRole('complementary', { name: 'Waitkit devtools' })).toBeTruthy();

    act(() => controller.dispose());

    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
