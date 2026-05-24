import type { WaitKitErrorEvent, WaitKitMatchEvent } from '@waitkit/core';
import { useEffect, useRef, useState } from 'react';

import { useWaitKit } from './use-wait-kit';
import { useWaitKitScenario } from './use-wait-kit-scenario';

export interface WaitKitDevToolsProps {
  maxLogEntries?: number;
}

type LogKind = 'match' | 'error';

interface LogEntry {
  id: number;
  kind: LogKind;
  url: string;
  method: string;
  scenario: string | undefined;
  delayMs: number;
}

const LOG_LIST_CLASS = 'waitkit-log-list';

const scrollbarCSS = `
  .${LOG_LIST_CLASS}::-webkit-scrollbar { width: 4px; }
  .${LOG_LIST_CLASS}::-webkit-scrollbar-track { background: transparent; }
  .${LOG_LIST_CLASS}::-webkit-scrollbar-thumb { background: #45475a; border-radius: 2px; }
  .${LOG_LIST_CLASS}::-webkit-scrollbar-thumb:hover { background: #585b70; }
`;

const styles = {
  panel: {
    position: 'fixed' as const,
    bottom: 16,
    right: 16,
    zIndex: 9999,
    width: 320,
    fontFamily: 'monospace',
    fontSize: 11,
    background: '#1e1e2e',
    color: '#cdd6f4',
    borderRadius: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 12px',
    background: '#313244',
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
  },
  headerLabel: {
    fontWeight: 'bold' as const,
    fontSize: 12,
    letterSpacing: '0.05em',
    color: '#cba6f7',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#cdd6f4',
    cursor: 'pointer' as const,
    padding: '0 4px',
    fontSize: 12,
  },
  body: {
    padding: '10px 12px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 10,
  },
  row: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  label: {
    color: '#a6adc8',
    minWidth: 60,
  },
  btn: (active: boolean, color: string) => ({
    padding: '2px 8px',
    borderRadius: 4,
    border: `1px solid ${color}`,
    background: active ? color : 'transparent',
    color: active ? '#1e1e2e' : color,
    cursor: 'pointer' as const,
    fontSize: 11,
    fontFamily: 'monospace',
  }),
  divider: {
    borderTop: '1px solid #313244',
    margin: '2px 0',
  },
  logList: {
    maxHeight: 150,
    overflowY: 'auto' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 2,
    flexShrink: 0,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: '#45475a transparent',
  },
  logLabel: {
    color: '#a6adc8',
    minWidth: 60,
    marginBottom: 4,
  },
  logEntry: (kind: LogKind) => ({
    color: kind === 'error' ? '#f38ba8' : '#a6e3a1',
    padding: '1px 0',
    minWidth: 0,
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  }),
  empty: {
    color: '#585b70',
    fontStyle: 'italic' as const,
  },
};

export function WaitKitDevTools({ maxLogEntries = 20 }: WaitKitDevToolsProps) {
  const { controller, enabled, enable, disable } = useWaitKit();
  const { scenario, scenarioNames, setScenario, resetScenario } = useWaitKitScenario();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(true);
  const counterRef = useRef(0);

  useEffect(() => {
    const handleMatch = (event: WaitKitMatchEvent) => {
      const entry: LogEntry = {
        id: ++counterRef.current,
        kind: 'match',
        url: event.url,
        method: event.method,
        scenario: event.scenario,
        delayMs: event.delayMs,
      };
      setLogs((prev) => [entry, ...prev].slice(0, maxLogEntries));
    };

    const handleError = (event: WaitKitErrorEvent) => {
      const entry: LogEntry = {
        id: ++counterRef.current,
        kind: 'error',
        url: event.url,
        method: event.method,
        scenario: event.scenario,
        delayMs: event.delayMs,
      };
      setLogs((prev) => [entry, ...prev].slice(0, maxLogEntries));
    };

    const unsubMatch = controller.addEventListener('match', handleMatch);
    const unsubError = controller.addEventListener('error', handleError);

    return () => {
      unsubMatch();
      unsubError();
    };
  }, [controller, maxLogEntries]);

  return (
    <div style={styles.panel}>
      <style>{scrollbarCSS}</style>
      <div
        style={styles.header}
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
        }}
      >
        <span style={styles.headerLabel}>⬡ Waitkit</span>
        <button style={styles.toggleBtn} aria-label={open ? 'collapse' : 'expand'}>
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={styles.body}>
          <div style={styles.row}>
            <span style={styles.label}>Status</span>
            <button style={styles.btn(enabled, '#a6e3a1')} onClick={enable}>
              Enabled
            </button>
            <button style={styles.btn(!enabled, '#f38ba8')} onClick={disable}>
              Disabled
            </button>
          </div>

          {scenarioNames.length > 0 && (
            <div style={styles.row}>
              <span style={styles.label}>Scenario</span>
              {scenarioNames.map((name) => (
                <button
                  key={name}
                  style={styles.btn(scenario === name, '#89b4fa')}
                  onClick={() => setScenario(name)}
                >
                  {name}
                </button>
              ))}
              <button style={styles.btn(scenario === undefined, '#a6adc8')} onClick={resetScenario}>
                reset
              </button>
            </div>
          )}

          <div style={styles.divider} />

          <div>
            <div style={styles.logLabel}>Log</div>
            <div style={styles.logList} className={LOG_LIST_CLASS}>
              {logs.length === 0 ? (
                <span style={styles.empty}>no requests yet</span>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} style={styles.logEntry(entry.kind)} title={entry.url}>
                    {entry.kind === 'error' ? '✕' : '✓'} {entry.method} {entry.url}
                    {entry.delayMs > 0 && ` +${entry.delayMs}ms`}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
