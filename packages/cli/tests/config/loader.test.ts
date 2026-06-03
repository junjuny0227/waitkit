import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config/loader.js';

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'waitkit-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when no config file exists', async () => {
    const result = await loadConfig(tmpDir);
    expect(result).toBeNull();
  });

  it('loads a .js config file', async () => {
    writeFileSync(
      join(tmpDir, 'waitkit.config.js'),
      `module.exports = { scenarios: { test: [{ url: '/api' }] } };`,
      'utf-8',
    );

    const result = await loadConfig(tmpDir);
    expect(result).not.toBeNull();
    expect(result?.scenarios?.['test']).toHaveLength(1);
  });

  it('loads a .mjs config file with default export', async () => {
    writeFileSync(
      join(tmpDir, 'waitkit.config.mjs'),
      `export default { scenarios: { demo: [{ url: '/demo' }] } };`,
      'utf-8',
    );

    const result = await loadConfig(tmpDir);
    expect(result).not.toBeNull();
    expect(result?.scenarios?.['demo']).toHaveLength(1);
  });

  it('prefers waitkit.config.ts over waitkit.config.js', async () => {
    writeFileSync(
      join(tmpDir, 'waitkit.config.js'),
      `module.exports = { scenarios: { from: 'js' } };`,
      'utf-8',
    );
    writeFileSync(
      join(tmpDir, 'waitkit.config.ts'),
      `export default { scenarios: { from: 'ts' } };`,
      'utf-8',
    );

    const result = await loadConfig(tmpDir);
    expect(result?.scenarios?.['from']).toBe('ts');
  });

  it('propagates errors that are not module-not-found', async () => {
    writeFileSync(
      join(tmpDir, 'waitkit.config.js'),
      `throw new Error('syntax error in config');`,
      'utf-8',
    );

    await expect(loadConfig(tmpDir)).rejects.toThrow('syntax error in config');
  });
});
