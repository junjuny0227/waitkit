# Waitkit Root-Cause Tracing

Use this reference when a failure crosses package boundaries.

## Core Behavior Trace

```text
setupWaitKit options
-> active rules or scenario
-> matcher
-> delay/error/timeout decision
-> Response or thrown error
-> controller state
-> restore behavior
```

Check both tests and README examples when public behavior is involved.

## Package Output Trace

```text
source export
-> tsup entry
-> dist file
-> package.json exports
-> consumer import or require
-> generated declaration file
```

If ESM works but CJS fails, inspect both `dist/index.js` and `dist/index.cjs`
plus `dist/index.d.ts` and `dist/index.d.cts`.

## Release Trace

```text
.changeset entry
-> package version
-> package changelog
-> npm package metadata
-> publish output
-> git tag
```

Separate npm authentication or scope permission failures from package build
failures.
