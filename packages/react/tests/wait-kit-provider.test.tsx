import { act, renderHook } from '@testing-library/react';
import { setupWaitKit } from '@waitkit/core';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWaitKit, useWaitKitScenario, WaitKitProvider } from '../src';

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
  vi.restoreAllMocks();
});

describe('WaitKitProvider', () => {
  it('provides the initial Waitkit state', () => {
    const controller = setupWaitKit({
      activeScenario: 'slow-network',
      scenarios: {
        'slow-network': [{ url: '/api/users', delay: 1000 }],
        'server-error': [{ url: '/api/users', errorRate: 1 }],
      },
    });

    const wrapper = createWrapper(controller, ['slow-network', 'server-error']);
    const { result } = renderHook(() => useWaitKit(), { wrapper });

    expect(result.current.enabled).toBe(true);
    expect(result.current.scenario).toBe('slow-network');
    expect(result.current.scenarioNames).toEqual(['slow-network', 'server-error']);
    expect(result.current.controller).toBe(controller);
  });

  it('updates consumers when enable and disable are called through the hook', () => {
    const controller = setupWaitKit({
      rules: [{ url: '/api/users', delay: 1000 }],
    });

    const wrapper = createWrapper(controller);
    const { result } = renderHook(() => useWaitKit(), { wrapper });

    expect(result.current.enabled).toBe(true);

    act(() => {
      result.current.disable();
    });

    expect(result.current.enabled).toBe(false);

    act(() => {
      result.current.enable();
    });

    expect(result.current.enabled).toBe(true);
  });

  it('updates consumers when scenarios are changed through the hook', () => {
    const controller = setupWaitKit({
      activeScenario: 'slow-network',
      scenarios: {
        'slow-network': [{ url: '/api/users', delay: 1000 }],
        'server-error': [{ url: '/api/users', errorRate: 1 }],
      },
    });

    const wrapper = createWrapper(controller, ['slow-network', 'server-error']);
    const { result } = renderHook(() => useWaitKitScenario(), { wrapper });

    expect(result.current.scenario).toBe('slow-network');

    act(() => {
      result.current.setScenario('server-error');
    });

    expect(result.current.scenario).toBe('server-error');

    act(() => {
      result.current.resetScenario();
    });

    expect(result.current.scenario).toBeUndefined();
  });

  it('throws core scenario errors through the hook', () => {
    const controller = setupWaitKit({
      scenarios: {
        'server-error': [{ url: '/api/users', errorRate: 1 }],
      },
    });

    const wrapper = createWrapper(controller, ['server-error']);
    const { result } = renderHook(() => useWaitKitScenario(), { wrapper });

    expect(() => {
      act(() => {
        result.current.setScenario('missing');
      });
    }).toThrow('WaitKit scenario "missing" does not exist.');
  });

  it('throws when useWaitKit is used outside a provider', () => {
    expect(() => renderHook(() => useWaitKit())).toThrow(
      'useWaitKit must be used within WaitKitProvider.',
    );
  });

  it('throws when useWaitKitScenario is used outside a provider', () => {
    expect(() => renderHook(() => useWaitKitScenario())).toThrow(
      'useWaitKitScenario must be used within WaitKitProvider.',
    );
  });
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
