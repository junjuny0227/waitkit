import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runValidate } from '../../src/commands/validate.js';

vi.mock('../../src/config/loader.js', () => ({
  loadConfig: vi.fn(),
}));

import { loadConfig } from '../../src/config/loader.js';

const mockLoadConfig = vi.mocked(loadConfig);

describe('runValidate', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits with error when config is not found', async () => {
    mockLoadConfig.mockResolvedValue(null);

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');
  });

  it('succeeds with a valid config', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: {
        'slow-network': [{ url: '/api', delay: 1000 }],
        'server-error': [{ url: '/api', errorRate: 0.5 }],
      },
    });

    await runValidate('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('is valid');
  });

  it('reports errorRate out of range', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: { bad: [{ url: '/api', errorRate: 2 }] },
    });

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');

    const errOutput = vi
      .mocked(console.error)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(errOutput).toContain('errorRate');
  });

  it('reports timeoutRate out of range', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: { bad: [{ url: '/api', timeoutRate: -1 }] },
    });

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');

    const errOutput = vi
      .mocked(console.error)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(errOutput).toContain('timeoutRate');
  });

  it('reports invalid delay range (min > max)', async () => {
    mockLoadConfig.mockResolvedValue({
      rules: [{ url: '/api', delay: [500, 100] as unknown as [number, number] }],
    });

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');

    const errOutput = vi
      .mocked(console.error)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(errOutput).toContain('delay');
  });

  it('reports invalid errorResponse.status', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: { bad: [{ url: '/api', errorResponse: { status: 999 } }] },
    });

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');

    const errOutput = vi
      .mocked(console.error)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(errOutput).toContain('status');
  });

  it('reports defaultScenario referencing a non-existent scenario', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: { real: [{ url: '/api' }] },
      defaultScenario: 'ghost',
    });

    await expect(runValidate('/any')).rejects.toThrow('process.exit called');

    const errOutput = vi
      .mocked(console.error)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(errOutput).toContain('"ghost"');
  });

  it('counts total scenarios and rules in the success message', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: {
        a: [{ url: '/a' }, { url: '/b' }],
        b: [{ url: '/c' }],
      },
    });

    await runValidate('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('2 scenarios');
    expect(logOutput).toContain('3 rules');
  });
});
