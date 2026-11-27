---
description: 'Package boundaries, public exports, manifests, and build config for Waitkit packages.'
paths:
  - 'packages/**/package.json'
  - 'packages/**/src/**/*'
  - 'packages/**/tsconfig.json'
  - 'packages/**/tsdown.config.ts'
  - 'pnpm-workspace.yaml'
  - 'turbo.json'
---

# Package architecture

## Dependency direction

```text
@waitkit/core  ←  @waitkit/react
               ←  @waitkit/msw   (+ msw types only)
               ←  @waitkit/cli   (+ commander, jiti)
```

- `core` depends on nothing at runtime. Adapters depend on `core` with `workspace:^`.
- An adapter needing a new default, validation, or decision gets it from a new `core` export,
  never from its own copy. If `core` lacks the hook, add it to `core` first.
- `msw` imports MSW only with `import type` from the `msw` root, which exists in MSW 2 and 3.
  `tests/msw2-compat.test.ts` type-checks against MSW 2 through the `msw2` alias; keep it passing.

## Public API

- Each package exports only from `src/index.ts`. Anything exported there is public and needs
  README coverage.
- Exported functions carry explicit return types (`isolatedDeclarations`).
- Manifests: `type: module`, `sideEffects: false` for libraries, `exports` with `import`
  (`./dist/index.js`) and `require` (`./dist/index.cjs`), `types` → `./dist/index.d.cts`,
  `files: ["dist", "LICENSE", "NOTICE"]`, `engines.node >=22.18.0`.
- Libraries ship ESM and CJS; the CLI ships ESM only.

## Shared versions

Tool versions used by several packages (`typescript`, `tsdown`, `vitest`, `react`, type
packages) come from the `catalog:` in `pnpm-workspace.yaml`. Bump them there, not per package.
