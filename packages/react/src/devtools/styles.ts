// Values come from packages/react/DESIGN.md. Change the contract first, then this file.

export const DEVTOOLS_CSS = `
:host { all: initial; }

.wk {
  --wk-surface: #15120F;
  --wk-surface-raised: #1E1A16;
  --wk-surface-control: #29241F;
  --wk-border: #352F28;
  --wk-text: #EDE6DA;
  --wk-muted: #A69A88;
  --wk-faint: #766C5F;
  --wk-primary: #E8A33D;
  --wk-on-primary: #15120F;
  --wk-error: #EC6B5E;
  --wk-timeout: #B79AF2;
  --wk-passthrough: #86C285;
  --wk-ring: #F5C873;
  --wk-shadow: 0 12px 32px rgb(0 0 0 / 0.35);

  --wk-radius: 10px;
  --wk-radius-control: calc(var(--wk-radius) - 4px);
  --wk-radius-badge: 4px;
  --wk-ease: cubic-bezier(0.2, 0, 0, 1);
  --wk-fast: 120ms;
  --wk-panel: 160ms;
  --wk-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --wk-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  position: fixed;
  z-index: 2147483000;
  font: 450 12px/16px var(--wk-sans);
  color: var(--wk-text);
  -webkit-font-smoothing: antialiased;
  color-scheme: dark;
}
.wk[data-position='bottom-right'] { right: 12px; bottom: 12px; }
.wk[data-position='bottom-left'] { left: 12px; bottom: 12px; }
.wk[data-position='top-right'] { right: 12px; top: 12px; }
.wk[data-position='top-left'] { left: 12px; top: 12px; }

.wk[data-theme='light'] {
  --wk-surface: #FBF9F6;
  --wk-surface-raised: #F2EEE8;
  --wk-surface-control: #E9E3DA;
  --wk-border: #DCD3C6;
  --wk-text: #211E1A;
  --wk-muted: #675E52;
  --wk-faint: #8F8577;
  --wk-primary: #965A06;
  --wk-on-primary: #FFFFFF;
  --wk-error: #B8382B;
  --wk-timeout: #6D45C7;
  --wk-passthrough: #3A7A39;
  --wk-ring: #965A06;
  --wk-shadow: 0 12px 32px rgb(33 30 26 / 0.16);
  color-scheme: light;
}
@media (prefers-color-scheme: light) {
  .wk[data-theme='system'] {
    --wk-surface: #FBF9F6;
    --wk-surface-raised: #F2EEE8;
    --wk-surface-control: #E9E3DA;
    --wk-border: #DCD3C6;
    --wk-text: #211E1A;
    --wk-muted: #675E52;
    --wk-faint: #8F8577;
    --wk-primary: #965A06;
    --wk-on-primary: #FFFFFF;
    --wk-error: #B8382B;
    --wk-timeout: #6D45C7;
    --wk-passthrough: #3A7A39;
    --wk-ring: #965A06;
    --wk-shadow: 0 12px 32px rgb(33 30 26 / 0.16);
    color-scheme: light;
  }
}

*, *::before, *::after { box-sizing: border-box; }
button { font: inherit; color: inherit; margin: 0; }
button:focus-visible { outline: 2px solid var(--wk-ring); outline-offset: 2px; }
svg { display: block; flex: none; }
.mono { font-family: var(--wk-mono); font-size: 11px; font-variant-numeric: tabular-nums; }
.sr-only {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* Launcher */
.launcher {
  display: inline-flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 12px 0 10px;
  border: 1px solid var(--wk-border); border-radius: 9999px;
  background: var(--wk-surface); box-shadow: var(--wk-shadow);
  cursor: pointer; white-space: nowrap;
  transition: background var(--wk-fast) var(--wk-ease);
}
.launcher:hover { background: var(--wk-surface-raised); }
.launcher-title { font-weight: 600; }
.launcher-scenario { color: var(--wk-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; }

.dot { width: 8px; height: 8px; border-radius: 9999px; background: var(--wk-faint); }
.dot[data-on='true'] { background: var(--wk-passthrough); }

.count {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9999px;
  background: var(--wk-primary); color: var(--wk-on-primary);
  font: 600 11px/18px var(--wk-mono); text-align: center;
}

/* Panel */
.panel {
  width: min(360px, calc(100vw - 24px));
  border: 1px solid var(--wk-border); border-radius: var(--wk-radius);
  background: var(--wk-surface); box-shadow: var(--wk-shadow);
  overflow: hidden;
  animation: wk-open var(--wk-panel) var(--wk-ease);
}
@keyframes wk-open { from { opacity: 0; transform: translateY(4px); } }

.header { display: flex; align-items: center; gap: 8px; padding: 10px 8px 10px 12px; }
.logo { color: var(--wk-primary); }
.title { font: 600 13px/16px var(--wk-sans); }
.spacer { flex: 1; }

.icon-button {
  display: grid; place-items: center; width: 28px; height: 28px;
  border: 0; border-radius: var(--wk-radius-control);
  background: transparent; color: var(--wk-muted); cursor: pointer;
  transition: background var(--wk-fast) var(--wk-ease), color var(--wk-fast) var(--wk-ease);
}
.icon-button:hover { background: var(--wk-surface-control); color: var(--wk-text); }

.switch {
  display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 8px;
  border: 0; border-radius: var(--wk-radius-control); background: transparent;
  color: var(--wk-muted); cursor: pointer;
}
.switch:hover { background: var(--wk-surface-raised); color: var(--wk-text); }
.switch-track {
  position: relative; width: 28px; height: 16px; border-radius: 9999px;
  background: var(--wk-surface-control); box-shadow: inset 0 0 0 1px var(--wk-border);
  transition: background var(--wk-fast) var(--wk-ease);
}
.switch-thumb {
  position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 9999px;
  background: var(--wk-muted);
  transition: transform var(--wk-fast) var(--wk-ease), background var(--wk-fast) var(--wk-ease);
}
.switch[aria-checked='true'] .switch-track { background: var(--wk-passthrough); box-shadow: none; }
.switch[aria-checked='true'] .switch-thumb { transform: translateX(12px); background: var(--wk-surface); }

.section { padding: 10px 12px 12px; border-top: 1px solid var(--wk-border); }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; min-height: 20px; }
.label { font: 600 11px/14px var(--wk-sans); letter-spacing: 0.04em; color: var(--wk-muted); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  height: 24px; padding: 0 10px; border: 0; border-radius: 9999px;
  background: var(--wk-surface-control); color: var(--wk-text); cursor: pointer;
  transition: background var(--wk-fast) var(--wk-ease), color var(--wk-fast) var(--wk-ease);
}
.chip:hover { box-shadow: inset 0 0 0 1px var(--wk-muted); }
.chip[aria-pressed='true'] { background: var(--wk-primary); color: var(--wk-on-primary); font-weight: 600; }
.chips[data-off='true'] .chip[aria-pressed='true'] { background: var(--wk-surface-control); color: var(--wk-text); box-shadow: inset 0 0 0 1px var(--wk-primary); }

.notice {
  margin: 0;
  display: flex; gap: 8px; align-items: flex-start;
  padding: 8px 12px; border-top: 1px solid var(--wk-border);
  background: var(--wk-surface-raised); color: var(--wk-muted);
}

.text-button {
  height: 24px; padding: 0 8px; border: 0; border-radius: var(--wk-radius-control);
  background: transparent; color: var(--wk-muted); cursor: pointer;
}
.text-button:hover { background: var(--wk-surface-control); color: var(--wk-text); }

.activity { list-style: none; margin: 0 -12px; padding: 0; max-height: 240px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--wk-border) transparent; }
.row { position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; padding: 6px 12px; }
.row:hover { background: var(--wk-surface-raised); }
.method { min-width: 34px; color: var(--wk-muted); }
.path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row[data-result='aborted'] .path { color: var(--wk-muted); text-decoration: line-through; }

.badge {
  padding: 1px 6px; border-radius: var(--wk-radius-badge);
  box-shadow: inset 0 0 0 1px currentColor; white-space: nowrap;
}
.badge[data-tone='delay'] { color: var(--wk-primary); }
.badge[data-tone='error'] { color: var(--wk-error); }
.badge[data-tone='timeout'] { color: var(--wk-timeout); }
.badge[data-tone='muted'] { color: var(--wk-muted); box-shadow: none; }

.bar { position: absolute; left: 12px; right: 12px; bottom: 1px; height: 2px; border-radius: 9999px; background: var(--wk-surface-control); overflow: hidden; }
.bar-fill { display: block; height: 100%; width: 100%; transform-origin: left; background: currentColor; transition: transform 100ms linear; }
.bar[data-tone='delay'] { color: var(--wk-primary); }
.bar[data-tone='timeout'] { color: var(--wk-timeout); }

.empty { margin: 0; padding: 12px 0 4px; color: var(--wk-muted); }

@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }
  .bar-fill { transition: none; }
  .launcher, .chip, .switch-track, .switch-thumb, .icon-button { transition: none; }
}
`;
