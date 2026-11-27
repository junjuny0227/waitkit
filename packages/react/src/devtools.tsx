import type { WaitKitMatchEvent, WaitKitOutcome } from '@waitkit/core';
import { type CSSProperties, type ReactNode, useId, useRef, useState } from 'react';

import { useWaitKit, useWaitKitEvent } from './hooks';

export type WaitKitDevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface WaitKitDevToolsProps {
  /** Defaults to `'bottom-right'`. */
  position?: WaitKitDevToolsPosition;
  /** Defaults to true. */
  defaultOpen?: boolean;
  /** Number of simulated requests kept in the log. Defaults to 20. */
  maxLogEntries?: number;
}

interface LogEntry {
  id: number;
  method: string;
  url: string;
  outcome: WaitKitOutcome['kind'];
  delayMs: number;
  detail: string;
}

const colors = {
  background: '#1e1e2e',
  surface: '#313244',
  border: '#45475a',
  text: '#cdd6f4',
  muted: '#a6adc8',
  faint: '#6c7086',
  accent: '#cba6f7',
  scenario: '#89b4fa',
  passthrough: '#a6e3a1',
  error: '#f38ba8',
  timeout: '#fab387',
} as const;

const outcomeStyle: Record<WaitKitOutcome['kind'], { color: string; label: string }> = {
  passthrough: { color: colors.passthrough, label: 'delay' },
  error: { color: colors.error, label: 'error' },
  timeout: { color: colors.timeout, label: 'timeout' },
};

const corner: Record<WaitKitDevToolsPosition, CSSProperties> = {
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
};

const styles = {
  panel: {
    position: 'fixed',
    zIndex: 2_147_483_000,
    width: 'min(340px, calc(100vw - 32px))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    lineHeight: 1.4,
    background: colors.background,
    color: colors.text,
    borderRadius: 8,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
  },
  header: {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: colors.surface,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: colors.accent,
  },
  body: { display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 12px' },
  row: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  label: { minWidth: 60, color: colors.muted },
  log: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 160,
    margin: 0,
    padding: 0,
    overflowY: 'auto',
    listStyle: 'none',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.border} transparent`,
  },
  logEntry: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { color: colors.faint, fontStyle: 'italic' },
} satisfies Record<string, CSSProperties>;

function chip(active: boolean, color: string): CSSProperties {
  return {
    padding: '2px 8px',
    border: `1px solid ${color}`,
    borderRadius: 4,
    background: active ? color : 'transparent',
    color: active ? colors.background : color,
    font: 'inherit',
    cursor: 'pointer',
  };
}

function toLogEntry(id: number, event: WaitKitMatchEvent): LogEntry {
  const { outcome } = event;
  const detail =
    outcome.kind === 'error'
      ? String(outcome.response.status)
      : outcome.kind === 'timeout'
        ? `${outcome.timeoutMs}ms`
        : '';

  return {
    id,
    method: event.method,
    url: event.url,
    outcome: outcome.kind,
    delayMs: outcome.delayMs,
    detail,
  };
}

/**
 * Floating panel to toggle Waitkit, switch scenarios, and watch simulated requests.
 * Render it only in development, next to your app inside `<WaitKitProvider>`.
 */
export function WaitKitDevTools({
  position = 'bottom-right',
  defaultOpen = true,
  maxLogEntries = 20,
}: WaitKitDevToolsProps): ReactNode {
  const waitkit = useWaitKit();
  const [open, setOpen] = useState(defaultOpen);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(0);
  const bodyId = useId();

  useWaitKitEvent('match', (event) => {
    nextId.current += 1;
    const entry = toLogEntry(nextId.current, event);
    setLog((previous) => [entry, ...previous].slice(0, maxLogEntries));
  });

  if (waitkit.disposed) {
    return null;
  }

  return (
    <aside aria-label="Waitkit devtools" style={{ ...styles.panel, ...corner[position] }}>
      <button
        type="button"
        style={styles.header}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>⬡ Waitkit</span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div id={bodyId} style={styles.body}>
          <div style={styles.row} role="group" aria-label="Status">
            <span style={styles.label}>Status</span>
            <button
              type="button"
              aria-pressed={waitkit.enabled}
              style={chip(waitkit.enabled, colors.passthrough)}
              onClick={waitkit.enable}
            >
              On
            </button>
            <button
              type="button"
              aria-pressed={!waitkit.enabled}
              style={chip(!waitkit.enabled, colors.error)}
              onClick={waitkit.disable}
            >
              Off
            </button>
          </div>

          {waitkit.scenarios.length > 0 && (
            <div style={styles.row} role="group" aria-label="Scenario">
              <span style={styles.label}>Scenario</span>
              <button
                type="button"
                aria-pressed={waitkit.scenario === undefined}
                style={chip(waitkit.scenario === undefined, colors.muted)}
                onClick={waitkit.resetScenario}
              >
                base
              </button>
              {waitkit.scenarios.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={waitkit.scenario === name}
                  style={chip(waitkit.scenario === name, colors.scenario)}
                  onClick={() => waitkit.setScenario(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div>
            <div style={{ ...styles.row, justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={styles.label}>Simulated</span>
              {log.length > 0 && (
                <button type="button" style={chip(false, colors.faint)} onClick={() => setLog([])}>
                  clear
                </button>
              )}
            </div>
            {log.length === 0 ? (
              <span style={styles.empty}>no simulated requests yet</span>
            ) : (
              <ul style={styles.log} aria-label="Simulated requests">
                {log.map((entry) => (
                  <li
                    key={entry.id}
                    title={entry.url}
                    style={{ ...styles.logEntry, color: outcomeStyle[entry.outcome].color }}
                  >
                    {outcomeStyle[entry.outcome].label}
                    {entry.detail && ` ${entry.detail}`} {entry.method} {entry.url}
                    {entry.delayMs > 0 && ` +${entry.delayMs}ms`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
