import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runList, runValidate } from '../src/commands/config';
import { runInit } from '../src/commands/init';
import { loadConfig } from '../src/load-config';
import type { Output } from '../src/output';

// Inside the package so config files can resolve `@waitkit/core` from node_modules.
const TMP_ROOT = join(import.meta.dirname, '..', 'node_modules', '.tmp');

let cwd: string;
let output: Output & { lines: string[]; errors: string[] };

beforeEach(() => {
  mkdirSync(TMP_ROOT, { recursive: true });
  cwd = mkdtempSync(join(TMP_ROOT, 'cli-'));
  const lines: string[] = [];
  const errors: string[] = [];
  output = { lines, errors, log: (line) => lines.push(line), error: (line) => errors.push(line) };
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

const write = (name: string, source: string) => writeFileSync(join(cwd, name), source, 'utf-8');

describe('loadConfig', () => {
  it('loads a TypeScript config that imports defineConfig from @waitkit/core', async () => {
    write(
      'waitkit.config.ts',
      `import { defineConfig } from '@waitkit/core';
       export default defineConfig({ scenarios: { slow: [{ url: '/api/*', delay: 1000 }] } });`,
    );

    const { path, config } = await loadConfig(cwd);

    expect(path).toBe(join(cwd, 'waitkit.config.ts'));
    expect(config).toEqual({ scenarios: { slow: [{ url: '/api/*', delay: 1000 }] } });
  });

  it('loads CommonJS and ESM JavaScript configs', async () => {
    write('waitkit.config.cjs', `module.exports = { rules: [{ url: '/a' }] };`);
    expect((await loadConfig(cwd)).config).toEqual({ rules: [{ url: '/a' }] });

    write('custom.mjs', `export default { rules: [{ url: '/b' }] };`);
    expect((await loadConfig(cwd, 'custom.mjs')).config).toEqual({ rules: [{ url: '/b' }] });
  });

  it('prefers waitkit.config.ts over other names', async () => {
    write('waitkit.config.js', `export default { rules: [] };`);
    write('waitkit.config.ts', `export default { scenarios: {} };`);

    expect((await loadConfig(cwd)).path).toBe(join(cwd, 'waitkit.config.ts'));
  });

  it('throws a helpful error when no config exists', async () => {
    await expect(loadConfig(cwd)).rejects.toThrow('Run `waitkit init` to create one.');
    await expect(loadConfig(cwd, 'missing.ts')).rejects.toThrow('Config file not found');
  });
});

describe('waitkit init', () => {
  it('creates a config that validates', async () => {
    expect(runInit({}, cwd, output)).toBe(0);
    expect(readFileSync(join(cwd, 'waitkit.config.ts'), 'utf-8')).toContain(
      "import { defineConfig } from '@waitkit/core';",
    );

    expect(await runValidate({}, cwd, output)).toBe(0);
  });

  it('refuses to overwrite without --force', () => {
    write('waitkit.config.ts', 'keep me');

    expect(runInit({}, cwd, output)).toBe(1);
    expect(readFileSync(join(cwd, 'waitkit.config.ts'), 'utf-8')).toBe('keep me');
    expect(output.errors[0]).toContain('already exists. Use --force');

    expect(runInit({ force: true }, cwd, output)).toBe(0);
    expect(readFileSync(join(cwd, 'waitkit.config.ts'), 'utf-8')).toContain('defineConfig');
  });
});

describe('waitkit validate', () => {
  it('reports every issue with its path and exits 1', async () => {
    write(
      'waitkit.config.ts',
      `export default {
         rules: [{ delay: 100 }],
         scenarios: { slow: [{ url: '/a', errorRate: 0.5 }] },
         scenario: 'fast',
       };`,
    );

    expect(await runValidate({}, cwd, output)).toBe(1);
    expect(output.errors).toEqual([
      `✗ ${join(cwd, 'waitkit.config.ts')} has 3 issues:`,
      '  rules[0].url: is required',
      '  scenarios.slow[0].errorRate: was removed in 1.0; use `error: { rate }`',
      '  scenario: "fast" is not defined in scenarios',
    ]);
  });

  it('exits 1 when the config is missing', async () => {
    expect(await runValidate({}, cwd, output)).toBe(1);
    expect(output.errors[0]).toContain('No Waitkit config found');
  });

  it('summarizes a valid config', async () => {
    write(
      'waitkit.config.mjs',
      `export default { rules: [{ url: '*' }], scenarios: { a: [], b: [] } };`,
    );

    expect(await runValidate({}, cwd, output)).toBe(0);
    expect(output.lines[0]).toMatch(/is valid \(1 base rules, 2 scenarios\)$/);
  });
});

describe('waitkit list', () => {
  it('describes every rule and marks the startup scenario', async () => {
    write(
      'waitkit.config.ts',
      `export default {
         rules: [{ url: '/health', method: 'GET' }],
         scenarios: {
           slow: [{ url: /api/, delay: [100, 300] }],
           broken: [
             { url: () => true, method: ['POST', 'PUT'], error: { rate: 0.25, status: 503 } },
             { url: '/api/*', timeout: {} },
           ],
         },
         scenario: 'broken',
       };`,
    );

    expect(await runList({}, cwd, output)).toBe(0);
    expect(output.lines).toEqual([
      'Base rules (1)',
      '  GET /health → passthrough',
      '',
      'Scenario "slow"',
      '  * /api/ → delay 100–300ms',
      '',
      'Scenario "broken" (active at startup)',
      '  POST,PUT (function) → error 503 (25%)',
      '  * /api/* → timeout 30000ms',
    ]);
  });
});
