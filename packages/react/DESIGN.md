---
name: Waitkit DevTools
colors:
  primary: '#E8A33D'
  on-primary: '#15120F'
  surface: '#15120F'
  on-surface: '#EDE6DA'
  surface-raised: '#1E1A16'
  surface-control: '#29241F'
  border: '#352F28'
  muted: '#A69A88'
  faint: '#766C5F'
  ring: '#F5C873'
  delay: '#E8A33D'
  error: '#EC6B5E'
  on-error: '#15120F'
  timeout: '#B79AF2'
  passthrough: '#86C285'
  aborted: '#A69A88'
typography:
  title:
    fontFamily: system-ui
    fontSize: 13px
    fontWeight: 600
    lineHeight: 16px
  label:
    fontFamily: system-ui
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.04em
  body:
    fontFamily: system-ui
    fontSize: 12px
    fontWeight: 450
    lineHeight: 16px
  code:
    fontFamily: ui-monospace
    fontSize: 11px
    fontWeight: 450
    lineHeight: 16px
rounded:
  sm: 4px
  md: 6px
  lg: 10px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
components:
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
  chip:
    backgroundColor: '{colors.surface-control}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.full}'
  chip-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
  activity-row:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
  activity-row-hover:
    backgroundColor: '{colors.surface-raised}'
---

# Waitkit DevTools design contract

Applies to `packages/react/src/devtools/**`. Values here are the source of truth; the CSS in
`devtools/styles.ts` uses them as custom properties.

## Overview

A floating developer panel that sits on top of someone else's app while they test loading and
error states. Audience: frontend developers mid-task, glancing at it between interactions.

It must read as **calm, precise, and out of the way**. Direction: **operational** (dense,
native controls, restrained color). Borrowed from terminal tooling: monospace for URLs and
durations only, and a warm dark shell so it does not look like the host app's own UI.

## Signature Element

**Live wait bars.** Every simulated request that is still waiting shows a thin bar that fills
over exactly its delay or timeout, with the remaining time beside it. Waiting is the product,
so the panel makes waiting visible; a template log of finished requests would not.

## Colors

Dark is the default theme; `theme="light"` or `theme="system"` switches the same variable names
under `[data-theme='light']`.

| Token           | Dark      | Light     | Use                                         |
| --------------- | --------- | --------- | ------------------------------------------- |
| surface         | `#15120F` | `#FBF9F6` | panel ground                                |
| surface-raised  | `#1E1A16` | `#F2EEE8` | row hover, launcher                         |
| surface-control | `#29241F` | `#E9E3DA` | chips, switch track                         |
| border          | `#352F28` | `#DCD3C6` | panel edge, section dividers                |
| on-surface      | `#EDE6DA` | `#211E1A` | primary text                                |
| muted           | `#A69A88` | `#675E52` | labels, secondary text                      |
| faint           | `#766C5F` | `#8F8577` | non-text only: off-state dot, striped track |
| primary / delay | `#E8A33D` | `#965A06` | brand, active scenario, waiting delay       |
| on-primary      | `#15120F` | `#FFFFFF` | text on the active chip and count badge     |
| error           | `#EC6B5E` | `#B8382B` | simulated error responses                   |
| timeout         | `#B79AF2` | `#6D45C7` | hanging requests and timeouts               |
| passthrough     | `#86C285` | `#3A7A39` | switch on, request handed to the network    |
| ring            | `#F5C873` | `#965A06` | focus ring                                  |

The brand color and the delay state are the same amber on purpose: Waitkit is about waiting.
Accent budget: amber appears on at most the active chip, the switch, and waiting bars.
Contrast (computed 2026-11-27): every text token is at least 4.5:1 on `surface` and
`surface-raised` in both themes; status colors are set as text only on those two surfaces,
never on `surface-control`. `faint` is 3.5:1 and is never used for text.

## Typography

System UI stack for everything (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`),
monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) only for methods, paths, status
codes, and durations, with `font-variant-numeric: tabular-nums`. Steps: title 13/600,
body 12/450, label 11/600 uppercase-free with 0.04em tracking, code 11/450. UI copy is English;
no CJK body text is set in the panel.

## Layout

Base unit 4px; spacing steps 4, 8, 12, 16. Panel width `min(360px, 100vw - 24px)`, offset 12px
from the chosen corner. Sections (header, scenario, activity) are separated by a 1px border,
padded 12px horizontally. The activity list owns the only scroll (max 240px). The launcher is
a 32px-high pill in the same corner.

## Elevation & Depth

One elevated surface: the panel and the launcher float above the host app with a single shadow
(`0 12px 32px rgb(0 0 0 / 0.35), 0 0 0 1px border`). Nothing inside the panel has a shadow.

## Shapes

Radius knob `--wk-radius: 10px`; panel = radius, controls = radius − 4 (6px), badges = 4px,
chips and switch = full.

## Components

- **Launcher** (collapsed): status dot + "Waitkit" + current scenario + waiting count badge.
  Opens the panel.
- **Header**: logo mark, title, simulation switch (`role="switch"`), collapse button.
- **Scenario chips**: `base` first, then scenario names in declaration order; single select,
  `aria-pressed`. Disabled look (not disabled behavior) while simulation is off.
- **Activity row**: method badge, path (full URL in `title`), outcome badge on the right;
  waiting rows add the wait bar and remaining time.
- **Notice**: one-line banner when simulation is off.
- **Empty state**: says what to do to see activity.

States for every control: default, hover (raised surface), focus-visible (2px ring, 2px
offset), active (pressed), disabled/off.

## Motion & Interaction

- `--wk-ease: cubic-bezier(0.2, 0, 0, 1)`; `--wk-fast: 120ms` for hover and chip changes,
  `--wk-panel: 160ms` for opening (fade + 4px rise).
- Wait bars animate linearly over the real wait duration; that motion carries information.
- `prefers-reduced-motion: reduce`: no open animation, wait bars show a static striped track and
  the remaining time still counts down as text.
- Shortcut: `Alt+Shift+W` toggles the panel (configurable, `false` disables).

## Do's and Don'ts

- Do render inside a Shadow DOM root so host styles never leak in and ours never leak out.
- Do show the path, not the origin; the origin is the same for almost every row.
- Don't add colors outside the table, gradients, glass, or blur.
- Don't use emoji as icons; icons are inline SVG at 14px with `aria-hidden`.
- Don't animate finished rows.

## Accessibility Constraints & Accepted Debt

- The panel is an `aside` landmark labelled "Waitkit devtools"; the activity list is a `ul`
  with `aria-live="polite"` announcing only finished requests.
- All controls are buttons reachable by Tab in visual order; targets are at least 24×24px.
- Accepted debt: the panel can cover host content in its corner; mitigated by `position`,
  collapse, and the shortcut. Drag-to-move is not provided.

## Research Log

- Local reference data (`omh design data --context dev-tool`): took the "Terminal Amber" warm
  dark shell and the "progress appears past one second" guideline; adjusted values for AA.
- Existing 0.x / 1.0-rc panel: kept monospace URLs and the corner placement; replaced the
  Catppuccin palette, the `✓/✕` log glyphs, and the always-open header.
