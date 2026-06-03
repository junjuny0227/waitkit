import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
    external: ['@waitkit/core'],
  },
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    target: 'node18',
    outDir: 'dist',
    external: ['@waitkit/core', 'commander', 'jiti'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
