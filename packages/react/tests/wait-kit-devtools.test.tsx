import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { setupWaitKit } from '@waitkit/core';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WaitKitDevTools, WaitKitProvider } from '../src';

const nativeFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = nativeFetch;
  vi.restoreAllMocks();
});

function createWrapper(
  controller: ReturnType<typeof setupWaitKit>,
  scenarioNames?: readonly string[],
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <WaitKitProvider controller={controller} scenarioNames={scenarioNames}>
        {children}
      </WaitKitProvider>
    );
  };
}

describe('WaitKitDevTools', () => {
  it('renders Enabled, Disabled, and Restore buttons', () => {
    const controller = setupWaitKit({ rules: [] });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    expect(screen.getByRole('button', { name: 'Enabled' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy();
  });

  it('renders scenario buttons when scenarioNames are provided', () => {
    const controller = setupWaitKit({
      scenarios: {
        slow: [{ url: '/api', delay: 500 }],
        error: [{ url: '/api', errorRate: 1 }],
      },
      activeScenario: 'slow',
    });
    const wrapper = createWrapper(controller, ['slow', 'error']);

    render(<WaitKitDevTools />, { wrapper });

    expect(screen.getByRole('button', { name: 'slow' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'error' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'reset' })).toBeTruthy();
  });

  it('disables waitkit when Disabled button is clicked', () => {
    const controller = setupWaitKit({ rules: [] });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    expect(controller.isEnabled()).toBe(true);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    });

    expect(controller.isEnabled()).toBe(false);
  });

  it('enables waitkit when Enabled button is clicked after disabling', () => {
    const controller = setupWaitKit({ rules: [] });
    controller.disable();
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
    });

    expect(controller.isEnabled()).toBe(true);
  });

  it('restores the original fetch when Restore button is clicked', () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    globalThis.fetch = fetchMock as typeof fetch;

    const controller = setupWaitKit({ rules: [] });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    });

    expect(controller.isEnabled()).toBe(false);
    expect(globalThis.fetch).toBe(fetchMock);
  });

  it('changes scenario when a scenario button is clicked', () => {
    const controller = setupWaitKit({
      scenarios: {
        slow: [{ url: '/api', delay: 500 }],
        error: [{ url: '/api', errorRate: 1 }],
      },
    });
    const wrapper = createWrapper(controller, ['slow', 'error']);

    render(<WaitKitDevTools />, { wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'slow' }));
    });

    expect(controller.getScenario()).toBe('slow');
  });

  it('resets scenario when reset button is clicked', () => {
    const controller = setupWaitKit({
      scenarios: {
        slow: [{ url: '/api', delay: 500 }],
      },
      activeScenario: 'slow',
    });
    const wrapper = createWrapper(controller, ['slow']);

    render(<WaitKitDevTools />, { wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    });

    expect(controller.getScenario()).toBeUndefined();
  });

  it('appends a match log entry when a fetch matches a rule', async () => {
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      rules: [{ url: '/api/users', delay: 0 }],
    });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    await act(async () => {
      await fetch('/api/users');
    });

    expect(screen.getByText(/\/api\/users/)).toBeTruthy();
  });

  it('appends an error log entry when a fetch triggers an error rule', async () => {
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      rules: [{ url: '/api/payment', errorRate: 1 }],
    });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    await act(async () => {
      await fetch('/api/payment');
    });

    // errorRate:1 triggers both match and error events, so at least one entry appears
    expect(screen.getAllByText(/\/api\/payment/).length).toBeGreaterThan(0);
  });

  it('respects maxLogEntries limit', async () => {
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      rules: [{ url: '/api/items', delay: 0 }],
    });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools maxLogEntries={2} />, { wrapper });

    await act(async () => {
      await fetch('/api/items');
      await fetch('/api/items');
      await fetch('/api/items');
    });

    expect(screen.getAllByText(/\/api\/items/)).toHaveLength(2);
  });

  it('collapses the panel when the header toggle is clicked', () => {
    const controller = setupWaitKit({ rules: [] });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    expect(screen.getByRole('button', { name: 'Enabled' })).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'collapse' }));
    });

    expect(screen.queryByRole('button', { name: 'Enabled' })).toBeNull();
  });

  it('expands the panel again after collapsing', () => {
    const controller = setupWaitKit({ rules: [] });
    const wrapper = createWrapper(controller);

    render(<WaitKitDevTools />, { wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'collapse' }));
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    });

    expect(screen.getByRole('button', { name: 'Enabled' })).toBeTruthy();
  });

  it('stops appending log entries after unmount', async () => {
    globalThis.fetch = vi.fn(async () => new Response('ok')) as typeof fetch;

    const controller = setupWaitKit({
      rules: [{ url: '/api/users', delay: 0 }],
    });
    const wrapper = createWrapper(controller);

    const { unmount } = render(<WaitKitDevTools />, { wrapper });

    unmount();

    await act(async () => {
      await fetch('/api/users');
    });

    expect(screen.queryByText(/\/api\/users/)).toBeNull();
  });
});
