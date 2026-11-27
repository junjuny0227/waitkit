import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { useWaitKit } from '../hooks';
import { ChevronDownIcon, InfoIcon, LogoIcon } from './icons';
import { ShadowPortal } from './shadow-portal';
import { DEVTOOLS_CSS } from './styles';
import { type ActivityEntry, useActivity } from './use-activity';

export type WaitKitDevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface WaitKitDevToolsProps {
  /** Corner the panel sits in. Defaults to `'bottom-right'`. */
  position?: WaitKitDevToolsPosition;
  /** Open state on first render when nothing is stored yet. Defaults to true. */
  defaultOpen?: boolean;
  /** Number of requests kept in the activity list. Defaults to 20. */
  maxLogEntries?: number;
  /** Color theme. `'system'` follows `prefers-color-scheme`. Defaults to `'dark'`. */
  theme?: 'dark' | 'light' | 'system';
  /**
   * Keyboard shortcut that opens and closes the panel, written as modifiers plus a letter
   * (`'alt+shift+w'`). Pass `false` to disable. Defaults to `'alt+shift+w'`.
   */
  shortcut?: string | false;
}

const STORAGE_KEY = 'waitkit:devtools:open';

function readStoredOpen(fallback: boolean): boolean {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === null || stored === undefined ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

function storeOpen(open: boolean): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, String(open));
  } catch {
    // Storage can be unavailable (private mode, sandboxed iframes); the panel still works.
  }
}

interface Shortcut {
  alt: boolean;
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
  code: string;
}

function parseShortcut(shortcut: string): Shortcut | undefined {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop();
  if (key === undefined || !/^[a-z]$/.test(key)) return undefined;

  return {
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    code: `Key${key.toUpperCase()}`,
  };
}

function useShortcut(shortcut: string | false, onPress: () => void): void {
  const latest = useRef(onPress);

  useEffect(() => {
    latest.current = onPress;
  });

  useEffect(() => {
    if (shortcut === false) return undefined;
    const parsed = parseShortcut(shortcut);
    if (parsed === undefined) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === parsed.code &&
        event.altKey === parsed.alt &&
        event.shiftKey === parsed.shift &&
        event.ctrlKey === parsed.ctrl &&
        event.metaKey === parsed.meta
      ) {
        event.preventDefault();
        latest.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcut]);
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

/** Elapsed and remaining time of the current wait, refreshed while the row is waiting. */
function useWaitClock(entry: ActivityEntry): { total: number; elapsed: number; remaining: number } {
  const total = entry.phase === 'delay' ? entry.outcome.delayMs : waitTotal(entry);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (entry.phase === 'done') return undefined;
    const timer = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(timer);
  }, [entry.phase]);

  const elapsed = Math.min(total, Math.max(0, now - entry.phaseStartedAt));
  return { total, elapsed, remaining: total - elapsed };
}

function waitTotal(entry: ActivityEntry): number {
  return entry.outcome.kind === 'timeout' ? entry.outcome.timeoutMs : 0;
}

interface Badge {
  tone: 'delay' | 'error' | 'timeout' | 'muted';
  text: string;
}

function finishedBadge(entry: ActivityEntry): Badge {
  const { outcome, result } = entry;

  if (result === 'aborted') return { tone: 'muted', text: 'aborted' };
  if (outcome.kind === 'error') return { tone: 'error', text: String(outcome.response.status) };
  if (outcome.kind === 'timeout')
    return { tone: 'timeout', text: `timeout ${formatMs(outcome.timeoutMs)}` };
  if (outcome.delayMs > 0) return { tone: 'delay', text: `+${formatMs(outcome.delayMs)}` };
  return { tone: 'muted', text: 'pass' };
}

interface WaitBarProps {
  tone: 'delay' | 'timeout';
  /** 0 to 1. Driven by the same clock as the remaining-time text, so the two never disagree. */
  progress: number;
}

function WaitBar({ tone, progress }: WaitBarProps): ReactNode {
  return (
    <span className="bar" data-tone={tone} aria-hidden="true">
      <span className="bar-fill" style={{ transform: `scaleX(${progress})` }} />
    </span>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }): ReactNode {
  const clock = useWaitClock(entry);
  const waiting = entry.phase !== 'done';
  const tone = entry.phase === 'hang' ? 'timeout' : 'delay';
  const badge: Badge = waiting
    ? {
        tone,
        text: `${entry.phase === 'hang' ? 'hanging' : 'waiting'} ${formatMs(clock.remaining)}`,
      }
    : finishedBadge(entry);

  return (
    <li className="row" data-result={entry.result} data-phase={entry.phase} title={entry.url}>
      <span className="method mono">{entry.method}</span>
      <span className="path mono">{entry.path}</span>
      <span className="badge mono" data-tone={badge.tone}>
        {badge.text}
      </span>
      {waiting && (
        <WaitBar tone={tone} progress={clock.total > 0 ? clock.elapsed / clock.total : 1} />
      )}
    </li>
  );
}

/**
 * Floating panel to switch Waitkit on and off, choose a scenario, and watch simulated
 * requests while they wait. Rendered in a shadow root so the app's CSS does not affect it.
 * Render it only in development, inside `<WaitKitProvider>`.
 */
export function WaitKitDevTools({
  position = 'bottom-right',
  defaultOpen = true,
  maxLogEntries = 20,
  theme = 'dark',
  shortcut = 'alt+shift+w',
}: WaitKitDevToolsProps): ReactNode {
  const waitkit = useWaitKit();
  const activity = useActivity(maxLogEntries);
  const [open, setOpenState] = useState(() => readStoredOpen(defaultOpen));
  const panelId = useId();

  const setOpen = (next: boolean) => {
    setOpenState(next);
    storeOpen(next);
  };
  const toggle = () => setOpen(!open);
  useShortcut(shortcut, toggle);

  if (waitkit.disposed) {
    return null;
  }

  const scenarioLabel = waitkit.scenario ?? 'base';
  const finished = activity.entries.filter((entry) => entry.phase === 'done').length;

  return (
    <ShadowPortal css={DEVTOOLS_CSS}>
      <aside
        className="wk"
        aria-label="Waitkit devtools"
        data-position={position}
        data-theme={theme}
      >
        {!open ? (
          <button
            type="button"
            className="launcher"
            aria-expanded="false"
            aria-controls={panelId}
            aria-label={`Open Waitkit devtools (${waitkit.enabled ? 'on' : 'off'}, scenario ${scenarioLabel})`}
            onClick={() => setOpen(true)}
          >
            <span className="dot" data-on={waitkit.enabled} />
            <span className="launcher-title">Waitkit</span>
            <span className="launcher-scenario">{scenarioLabel}</span>
            {activity.waiting > 0 && <span className="count">{activity.waiting}</span>}
          </button>
        ) : (
          <div className="panel" id={panelId}>
            <div className="header">
              <span className="logo">
                <LogoIcon />
              </span>
              <span className="title">Waitkit</span>
              <span className="spacer" />
              <button
                type="button"
                role="switch"
                className="switch"
                aria-checked={waitkit.enabled}
                onClick={waitkit.enabled ? waitkit.disable : waitkit.enable}
              >
                <span>Simulate</span>
                <span className="switch-track" aria-hidden="true">
                  <span className="switch-thumb" />
                </span>
              </button>
              <button
                type="button"
                className="icon-button"
                aria-expanded="true"
                aria-controls={panelId}
                aria-label="Collapse Waitkit devtools"
                title={shortcut === false ? undefined : `Collapse (${shortcut})`}
                onClick={() => setOpen(false)}
              >
                <ChevronDownIcon />
              </button>
            </div>

            {!waitkit.enabled && (
              <p className="notice">
                <InfoIcon />
                <span>Simulation is off. Requests go straight to the network.</span>
              </p>
            )}

            {waitkit.scenarios.length > 0 && (
              <section className="section" aria-labelledby={`${panelId}-scenario`}>
                <div className="section-head">
                  <span className="label" id={`${panelId}-scenario`}>
                    Scenario
                  </span>
                </div>
                <div
                  className="chips"
                  role="group"
                  aria-labelledby={`${panelId}-scenario`}
                  data-off={!waitkit.enabled}
                >
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={waitkit.scenario === undefined}
                    title="Base rules, no scenario"
                    onClick={waitkit.resetScenario}
                  >
                    base
                  </button>
                  {waitkit.scenarios.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="chip"
                      aria-pressed={waitkit.scenario === name}
                      onClick={() => waitkit.setScenario(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="section" aria-labelledby={`${panelId}-activity`}>
              <div className="section-head">
                <span className="label" id={`${panelId}-activity`}>
                  Activity
                  {activity.waiting > 0 && ` · ${activity.waiting} waiting`}
                </span>
                {activity.entries.length > 0 && (
                  <button type="button" className="text-button" onClick={activity.clear}>
                    Clear
                  </button>
                )}
              </div>
              {activity.entries.length === 0 ? (
                <p className="empty">
                  No simulated requests yet. Pick a scenario, then trigger a request in your app.
                </p>
              ) : (
                <ul className="activity" aria-label="Simulated requests">
                  {activity.entries.map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              )}
              <span className="sr-only" aria-live="polite">
                {finished > 0 ? `${finished} simulated requests finished` : ''}
              </span>
            </section>
          </div>
        )}
      </aside>
    </ShadowPortal>
  );
}
