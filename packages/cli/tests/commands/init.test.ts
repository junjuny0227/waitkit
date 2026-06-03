import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runInit } from '../../src/commands/init.js';

describe('runInit', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'waitkit-init-test-'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('creates waitkit.config.ts in the target directory', () => {
    runInit({}, tmpDir);

    const configPath = join(tmpDir, 'waitkit.config.ts');
    expect(existsSync(configPath)).toBe(true);
  });

  it('generated file contains defineConfig and example scenarios', () => {
    runInit({}, tmpDir);

    const content = readFileSync(join(tmpDir, 'waitkit.config.ts'), 'utf-8');
    expect(content).toContain("from '@waitkit/cli'");
    expect(content).toContain('defineConfig');
    expect(content).toContain('slow-network');
    expect(content).toContain('server-error');
    expect(content).toContain('timeout');
  });

  it('throws when config already exists and --force is not set', () => {
    writeFileSync(join(tmpDir, 'waitkit.config.ts'), '// existing', 'utf-8');

    expect(() => runInit({}, tmpDir)).toThrow('already exists');
  });

  it('overwrites existing config when --force is set', () => {
    writeFileSync(join(tmpDir, 'waitkit.config.ts'), '// old content', 'utf-8');

    runInit({ force: true }, tmpDir);

    const content = readFileSync(join(tmpDir, 'waitkit.config.ts'), 'utf-8');
    expect(content).toContain('defineConfig');
  });
});
