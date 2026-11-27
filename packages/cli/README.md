# @waitkit/cli

Create, inspect, and validate [Waitkit](../core) config files.

```sh
npm install -D @waitkit/cli @waitkit/core
```

## Commands

```sh
waitkit init                 # create waitkit.config.ts with example scenarios
waitkit init --force         # overwrite an existing file
waitkit init --file waitkit.config.mts

waitkit list                 # print base rules and each scenario's rules
waitkit validate             # report every issue; exits 1 when the config is invalid

waitkit list -c config/waitkit.config.ts   # use a specific file
waitkit -C apps/web validate               # run in another directory
```

Without `-c`, the first of `waitkit.config.{ts,mts,cts,js,mjs,cjs}` in the working directory is
used. TypeScript files are loaded directly; no build step is needed.

```text
$ waitkit list
Base rules (1)
  * /api/* → delay 200–600ms

Scenario "server-error"
  * /api/* → error 500

Scenario "flaky"
  POST /api/orders → error 503 (30%)
```

```text
$ waitkit validate
✗ /app/waitkit.config.ts has 2 issues:
  scenarios.flaky[0].errorRate: was removed in 1.0; use `error: { rate }`
  scenario: "slow" is not defined in scenarios
```

`waitkit validate` uses the same `validateConfig` as `setupWaitKit`, so a config that passes here
also passes at runtime. Run it in CI next to your tests.

The config file is the same one the app imports. Define it with `defineConfig` from
`@waitkit/core`.

## License

Apache-2.0
