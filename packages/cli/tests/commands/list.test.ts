import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runList } from '../../src/commands/list.js';

vi.mock('../../src/config/loader.js', () => ({
  loadConfig: vi.fn(),
}));

import { loadConfig } from '../../src/config/loader.js';

const mockLoadConfig = vi.mocked(loadConfig);

describe('runList', () => {
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

    await expect(runList('/any')).rejects.toThrow('process.exit called');
  });

  it('prints scenario names and rule counts', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: {
        'slow-network': [{ url: '/api', delay: 1000 }],
        'server-error': [{ url: '/api', errorRate: 1 }],
      },
    });

    await runList('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('Scenarios (2)');
    expect(logOutput).toContain('slow-network');
    expect(logOutput).toContain('server-error');
    expect(logOutput).toContain('1 rule');
  });

  it('marks defaultScenario with (default) label', async () => {
    mockLoadConfig.mockResolvedValue({
      scenarios: { fast: [{ url: '/api' }], slow: [{ url: '/api', delay: 500 }] },
      defaultScenario: 'fast',
    });

    await runList('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('fast   (1 rule) (default)');
  });

  it('prints default rules count when rules are present', async () => {
    mockLoadConfig.mockResolvedValue({
      rules: [{ url: '/health' }],
    });

    await runList('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('Default rules: 1');
  });

  it('prints message when config has no scenarios or rules', async () => {
    mockLoadConfig.mockResolvedValue({});

    await runList('/any');

    const logOutput = vi
      .mocked(console.log)
      .mock.calls.map((c) => c[0])
      .join('\n');
    expect(logOutput).toContain('No scenarios or rules defined.');
  });
});
