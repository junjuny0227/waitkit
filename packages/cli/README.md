# @waitkit/cli

CLI for managing [Waitkit](https://github.com/junjuny0227/waitkit) network simulation configurations.

`@waitkit/cli` generates a `waitkit.config.ts` file, lists scenarios, and validates
rule definitions — without touching your app code.

## Requirements

- Node.js **v18 or later**
- @waitkit/core **v0.3 or later** (installed automatically)

## Installation

```bash
npm install -D @waitkit/cli
# or
pnpm add -D @waitkit/cli
# or
yarn add -D @waitkit/cli
# or
bun add -d @waitkit/cli
```

## Commands

### `waitkit init`

Creates a `waitkit.config.ts` file in the current directory with three example
scenarios.

```bash
waitkit init
# Created ✓ waitkit.config.ts
```

If a `waitkit.config.ts` already exists, the command exits with an error. Use
`--force` to overwrite:

```bash
waitkit init --force
```

### `waitkit list`

Reads `waitkit.config.ts` and prints all defined scenarios and rule counts.

```bash
waitkit list
# Scenarios (3):
#   • slow-network   (1 rule)
#   • server-error   (1 rule)
#   • timeout        (1 rule) (default)
```

If a `defaultScenario` is set, it is shown with a `(default)` label. Top-level
`rules` are reported separately as `Default rules: n`.

### `waitkit validate`

Reads `waitkit.config.ts` and validates every rule in all scenarios and the
top-level `rules` array.

```bash
waitkit validate
# ✓ waitkit.config.ts is valid — 3 scenarios, 3 rules
```

If invalid values are found, each error is printed and the process exits with a
non-zero code:

```bash
waitkit validate
# ✗ scenarios.bad[0]: WaitKit errorRate must be a number between 0 and 1
# ✗ scenarios.bad[1]: WaitKit delay range must have min less than or equal to max.
#
# ✗ 2 error(s) found
```

All three commands look for the config file in the current working directory.

## Config file

Running `waitkit init` produces a `waitkit.config.ts` in this shape:

```typescript
import { defineConfig } from '@waitkit/cli';

export default defineConfig({
  scenarios: {
    'slow-network': [{ url: /\/api\//, delay: 2000 }],
    'server-error': [
      {
        url: /\/api\//,
        errorRate: 1,
        errorResponse: { status: 500, body: { message: 'Internal Server Error' } },
      },
    ],
    timeout: [{ url: /\/api\//, timeoutRate: 1, timeoutMs: 3000 }],
  },
});
```

`defineConfig` is an identity function that exists solely for IDE type
completions. The default export must be a `WaitKitConfig` object.

Config files are loaded at runtime using [jiti](https://github.com/unjs/jiti),
so TypeScript syntax, `RegExp` literals, and function URL matchers are all
supported without a separate compile step.

## Using the config in app code

The config file is a plain module — import it directly and pass its contents to
`setupWaitKit`:

```typescript
import { setupWaitKit } from '@waitkit/core';
import config from './waitkit.config';

export const controller = setupWaitKit({
  enabled: import.meta.env.DEV,
  scenarios: config.scenarios,
  rules: config.rules,
  activeScenario: config.defaultScenario,
});
```

## `WaitKitConfig` options

- `rules`: Top-level rules applied when no scenario is active.
- `scenarios`: Named collections of rules. Keys are scenario names.
- `defaultScenario`: Scenario name passed to `activeScenario` when setting up
  the controller.

Each rule follows the `WaitKitRule` type from `@waitkit/core`. See the
[@waitkit/core README](https://github.com/junjuny0227/waitkit/tree/main/packages/core)
for the full list of rule options.

## License

MIT
