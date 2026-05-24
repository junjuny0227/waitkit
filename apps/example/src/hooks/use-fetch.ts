import { useCallback, useEffect, useRef, useState } from 'react';

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({ status: 'error', message: body.message ?? `HTTP ${res.status}` });
        return;
      }
      const data: T = await res.json();
      setState({ status: 'success', data });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState({ status: 'error', message: (err as Error).message });
    }
  }, [url]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { state, reload: load };
}
