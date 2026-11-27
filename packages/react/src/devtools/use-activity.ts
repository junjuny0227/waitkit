import type { WaitKitMatchEvent, WaitKitOutcome, WaitKitSettleResult } from '@waitkit/core';
import { useState } from 'react';

import { useWaitKitEvent } from '../hooks';

export type ActivityPhase = 'delay' | 'hang' | 'done';

export interface ActivityEntry {
  id: number;
  method: string;
  /** Path and query, shown in the row. */
  path: string;
  /** Absolute URL, shown on hover. */
  url: string;
  outcome: WaitKitOutcome;
  phase: ActivityPhase;
  /** `performance.now()` when the current phase started. */
  phaseStartedAt: number;
  result: WaitKitSettleResult | undefined;
}

export interface Activity {
  entries: readonly ActivityEntry[];
  waiting: number;
  clear: () => void;
}

function toPath(href: string): string {
  const url = new URL(href);
  return `${url.pathname}${url.search}`;
}

function startPhase(outcome: WaitKitOutcome): ActivityPhase {
  if (outcome.delayMs > 0) return 'delay';
  return outcome.kind === 'timeout' ? 'hang' : 'done';
}

function fromMatch(event: WaitKitMatchEvent): ActivityEntry {
  return {
    id: event.id,
    method: event.method,
    path: toPath(event.url),
    url: event.url,
    outcome: event.outcome,
    phase: startPhase(event.outcome),
    phaseStartedAt: performance.now(),
    result: undefined,
  };
}

function update(
  entries: readonly ActivityEntry[],
  id: number,
  change: (entry: ActivityEntry) => ActivityEntry,
): readonly ActivityEntry[] {
  return entries.map((entry) => (entry.id === id ? change(entry) : entry));
}

/** Tracks simulated requests from match to settle, newest first. */
export function useActivity(maxEntries: number): Activity {
  const [entries, setEntries] = useState<readonly ActivityEntry[]>([]);

  useWaitKitEvent('match', (event) => {
    setEntries((previous) => [fromMatch(event), ...previous].slice(0, maxEntries));
  });

  useWaitKitEvent('delayEnd', (event) => {
    if (event.outcome.kind !== 'timeout') return;
    setEntries((previous) =>
      update(previous, event.id, (entry) => ({
        ...entry,
        phase: 'hang',
        phaseStartedAt: performance.now(),
      })),
    );
  });

  useWaitKitEvent('settle', (event) => {
    setEntries((previous) =>
      update(previous, event.id, (entry) => ({ ...entry, phase: 'done', result: event.result })),
    );
  });

  return {
    entries,
    waiting: entries.filter((entry) => entry.phase !== 'done').length,
    clear: () => setEntries([]),
  };
}
