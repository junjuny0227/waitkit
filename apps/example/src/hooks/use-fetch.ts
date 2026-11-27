import { useEffect, useState } from 'react';

export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

async function request<T>(url: string, signal: AbortSignal): Promise<FetchState<T>> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? String(body.message)
          : `HTTP ${response.status}`;
      return { status: 'error', message };
    }
    // Trusting the example API's shape; real code would validate it.
    const data: T = await response.json();
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Fetches `url` once per mount and aborts it on unmount. To refetch, remount the
 * component with a new `key`; Waitkit then rejects the pending delay with an AbortError.
 */
export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      const next = await request<T>(url, controller.signal);
      if (!controller.signal.aborted) setState(next);
    };
    void run();

    return () => controller.abort();
  }, [url]);

  return state;
}
