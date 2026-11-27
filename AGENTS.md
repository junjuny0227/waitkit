# AGENTS.md

Instructions for coding agents working in this repository. Claude Code reads this file through
`CLAUDE.md`; Codex, Hermes, and other agents read it directly.

<!-- omh:agent-instructions:begin -->

## What this repo is

Waitkit is a pnpm + Turborepo monorepo of development-only network simulation libraries:
`packages/core`, `packages/react`, `packages/msw`, `packages/cli`, plus `apps/example` (Vite +
React demo). Packages extend the root `tsconfig.base.json` by relative path. The 1.0 design and the reasons
behind it are in `docs/rfc-1.0.md`; user-facing changes from 0.x are in `docs/migration-1.0.md`.

## Build and test

Run from the repo root. Requires Node.js 22.18+; pnpm is pinned by `packageManager` in
`package.json` (corepack or pnpm's own version switching picks it up).

| Command                                      | What it does                                                                    | Status                               |
| -------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| `pnpm install`                               | Install; the lockfile must stay in sync (CI uses `--frozen-lockfile`)           | verified (exit 0, 2026-11-27)        |
| `pnpm check`                                 | format:check → build → lint → check-types → test, stops on first failure        | verified (exit 0, 2026-11-27)        |
| `pnpm format` / `pnpm format:check`          | oxfmt write / check                                                             | verified (exit 0, 2026-11-27)        |
| `pnpm lint` / `pnpm lint:fix`                | oxlint with type-aware rules, warnings fail                                     | verified (exit 0, 2026-11-27)        |
| `pnpm check-types`                           | `tsc` (TypeScript 7) in every package via Turbo                                 | verified (exit 0, 2026-11-27)        |
| `pnpm build`                                 | tsdown builds; publint and attw run inside the build                            | verified (exit 0, 2026-11-27)        |
| `pnpm test`                                  | Vitest in each package; `apps/example` runs `waitkit validate`                  | verified (exit 0, 2026-11-27)        |
| `pnpm --filter <pkg> exec vitest run <file>` | One package or one file                                                         | verified (exit 0, 2026-11-27)        |
| `pnpm --filter example dev`                  | Example app on Vite; `/api` is proxied to JSONPlaceholder                       | verified (served, 2026-11-27)        |
| `pnpm changeset`                             | Add a release note for npm-visible changes                                      | unverified (interactive)             |
| `pnpm changeset status`                      | Show pending version bumps                                                      | verified (exit 0, 2026-11-27)        |
| `pnpm release:check v<version>`              | Check every package is at the tag's version (release flow: `docs/releasing.md`) | verified (exit 1 on 0.x, 2026-11-27) |

Set `TURBO_UI=stream` when capturing Turbo output: `turbo.json` uses the TUI, which garbles logs.

## Architecture rules the code does not enforce

- **`@waitkit/core` owns every policy.** URL matching, config validation, defaults, and the
  decision of what happens to a request (`resolveOutcome`) and how it is executed
  (`applyOutcome`) live only in core. `react`, `msw`, and `cli` call those exports and must not
  re-implement defaults, validation, or response building. 0.x drifted because MSW copied core
  logic; that is the failure this rule prevents.
- **Core stays framework-free**: no React, MSW, Node-only, or CLI imports in `packages/core/src`.
  It must run in browsers, Node 22+, and test environments.
- **Determinism**: anything random goes through the injectable `random` option; tests pass a
  fixed function instead of spying on `Math.random`.
- **Global state**: `setupWaitKit` patches `globalThis.fetch`; every change to that path needs a
  test that `dispose()` restores the original fetch.
- **Dependency direction**: `core` has no runtime dependencies; `react`, `msw`, and `cli` depend
  on it with `workspace:^`. If an adapter needs a default, check, or decision that core lacks,
  add a core export first.
- **MSW 2 and 3**: `packages/msw` imports MSW only with `import type` from the `msw` root.
  `tests/msw2-compat.test.ts` type-checks against MSW 2 through the `msw2` alias; keep it passing.
- **Public API changes** need a changeset, a README update in the package, and, if breaking, an
  entry in `docs/migration-1.0.md` (or the next major's guide). Each package exports only from
  `src/index.ts`; everything exported there is public and needs README coverage, and README
  examples must use real exports.
- **Manifests**: libraries ship ESM + CJS (`exports.import` → `./dist/index.js`,
  `exports.require` → `./dist/index.cjs`, `types` → `./dist/index.d.cts`), `sideEffects: false`,
  `files: ["dist", "LICENSE", "NOTICE"]`, `engines.node >=22.18.0`; the CLI ships ESM only.
  Versions shared by several packages come from the `catalog:` in `pnpm-workspace.yaml`.

## Core behavior contract

These are promises to users; changing one is a breaking change. Every behavior change in core
comes with a test in `packages/core/tests`, using `random` and fake timers.

- Effects apply in the order delay → timeout → error → passthrough; the first matching rule
  wins; an active scenario replaces `rules` instead of merging. Defaults: `rate` 1, `timeout.ms`
  30000, `error.status` 500.
- String `url` is a path pattern over the whole pathname (`:param` = one segment, `*` = the
  rest, query ignored, trailing slash optional; a scheme also matches the origin). RegExp tests
  `url.href`; functions get a `URL`.
- `validateConfig` returns every issue with a path and never throws. Renamed or removed options
  go into `REMOVED_KEYS` in `packages/core/src/config.ts` so the error names the replacement.
- `resolveOutcome` is pure apart from the injected `random`. `applyOutcome` waits, emits through
  callbacks, and rejects with `signal.reason` on abort. Timeout errors are `WaitKitTimeoutError`
  with the message `WaitKit timed out <METHOD> <url> after <ms>ms.` (core and msw tests pin it).
- `getState()` returns the same frozen object until something changes (React's
  `useSyncExternalStore` relies on it); each real change emits one `change` event, no-ops emit
  nothing. `dispose()` is final, restores `fetch` only if our patch is still installed, and
  clears listeners; a new `setupWaitKit` disposes the previous controller.

## Generated and copied files

Never hand-edit these; change the source and regenerate.

| File                                                            | Source                                                 | Regenerate                      | Checked by                              |
| --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------- | --------------------------------------- |
| `packages/*/dist/**`                                            | `src/**`, `tsdown.config.ts`                           | `pnpm build`                    | publint + attw in the build             |
| `packages/*/CHANGELOG.md`, versions                             | `.changeset/*.md`                                      | `pnpm changeset:version`        | review                                  |
| `pnpm-lock.yaml`                                                | `package.json` files, catalog in `pnpm-workspace.yaml` | `pnpm install`                  | CI `--frozen-lockfile`                  |
| `pnpm-workspace.yaml` `minimumReleaseAgeExclude`, `permissions` | pnpm 12 policy prompts                                 | `pnpm install` / `pnpm approve` | `pnpm install`                          |
| `packages/{core,react,msw,cli}/LICENSE`, `NOTICE`               | root `LICENSE`, `NOTICE`                               | copy from root                  | review (npm packs only the package dir) |

## Gates

- CI (`.github/workflows/ci.yml`) runs install with `--frozen-lockfile`, then format:check,
  build, lint, check-types, and test on Node 22 and 24. It has not run on GitHub yet as of
  2026-11-27.
- `pnpm lint` uses `--deny-warnings`: a warning fails the gate.
- `pnpm build` fails on publint errors, so `package.json` `main`/`module`/`exports`/`bin` must
  name the exact files tsdown emits.

## Pitfalls

- **Stale core types in dependents.** `lint` (type-aware), `check-types`, and `test` read
  `@waitkit/core` from its `dist`, not `src`; CI and `pnpm check` build before linting. After changing core exports, run `pnpm --filter @waitkit/core build` before
  running `tsc` or Vitest in another package alone, or you get "has no exported member" errors
  for code that exists.
- **`isolatedDeclarations` is on.** Exported functions need explicit return types, and
  `tsdown.config.ts` / `vitest.config.ts` must export an annotated const (`const config:
  UserConfig = defineConfig(...)`); a bare `export default defineConfig(...)` fails with TS9037.
- **TypeScript 7 has no typescript-eslint support** (its peer range stops below 6.1), which is why
  linting is oxlint with `oxlint-tsgolint`. Do not reintroduce ESLint for typed rules. TS 7 also
  ships no `tsserver` library; editors need the TypeScript native preview extension
  (`.vscode/extensions.json`).
- **tsdown file names**: with `"type": "module"`, ESM output is `.js`/`.d.ts` and CJS is
  `.cjs`/`.d.cts`; the CLI (platform `node`) emits `.mjs`. A manifest pointing at another name
  fails the build through publint.
- **Fake timers and rejections**: attach `promise.catch(() => {})` before advancing timers, then
  `await expect(promise).rejects...`. Storing `expect(...).rejects` in a variable trips
  `vitest/valid-expect`, and awaiting late without the catch logs an unhandled rejection.
- **MSW 3 option names changed**: `server.listen({ onUnhandledFrame: 'error' })`, not
  `onUnhandledRequest`. The one type assertion in `packages/msw/src/with-wait-kit.ts` is required
  because MSW's strict response type cannot describe a simulated error `Response`.
- **CLI tests need resolvable imports**: temporary config files are written under
  `packages/cli/node_modules/.tmp` so `import ... from '@waitkit/core'` resolves; a system temp
  directory cannot see the workspace packages.
- **pnpm 12 permissions**: tsdown asks for a `skills` permission on install. It is denied in
  `pnpm-workspace.yaml`; answer new prompts with `pnpm approve`, never by editing the lockfile.
- **Known noise**: under Node 26 the MSW tests print an `ExperimentalWarning` about
  `localStorage`. It comes from Node, not from this repo.

## Conventions

- Branches: `<type>/<kebab-case>` with type `feat`, `fix`, `refactor`, `chore`, `docs`, `test`,
  or `ci`. Commits: Conventional Commits, scope when it helps (`core`, `react`, `msw`, `cli`,
  `example`, `docs`, `release`, `tooling`, `ci`, `harness`). One logical change per commit; keep
  source, formatting churn, release metadata, and agent-instruction edits in separate commits.
- PRs follow `.github/PULL_REQUEST_TEMPLATE.md` (purpose, changes, gate commands actually run,
  release impact, changeset). Reply to every review comment, including ones not applied, with
  the reason.
- Language: code, comments, npm-facing READMEs, `docs/`, and changesets in English. `ROADMAP.md`,
  PR titles and bodies, and review replies in Korean. Test titles in `packages/msw/tests` are
  Korean; the other packages use English — match the file.
- Changesets: `patch` for fixes and npm-visible doc fixes, `minor` for backwards-compatible
  features, `major` for breaking changes. No changeset for repo-only docs or tooling.
- Do not commit, push, open PRs, reply on GitHub, or publish unless the user asks for that step.
- Releases: all packages share one version (changesets `fixed`). npm publishing runs only in
  `.github/workflows/publish.yml` after a person publishes the draft GitHub release; never push
  `v*` tags or publish releases unless asked. Steps: `docs/releasing.md`.
- License: Apache-2.0 for 1.0 onward. New publishable packages need `LICENSE` and `NOTICE` copies
  and `"license": "Apache-2.0"`.

<!-- omh:agent-instructions:end -->
