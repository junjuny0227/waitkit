import { describe, expect, it } from 'vitest';

import { defineConfig, validateConfig, validateEffects } from '../src';

const paths = (config: unknown) => validateConfig(config).map((issue) => issue.path);

describe('validateConfig', () => {
  it('accepts a complete config', () => {
    const config = defineConfig({
      rules: [{ url: '/api/*', delay: [100, 300] }],
      scenarios: {
        slow: [{ url: /api/, delay: 2000 }],
        broken: [
          {
            url: (u: URL) => u.pathname === '/x',
            method: ['GET', 'POST'],
            error: { rate: 0.5, status: 503, statusText: 'Down', body: { message: 'down' } },
          },
        ],
        hang: [{ url: '*', timeout: { rate: 1, ms: 3000 } }],
      },
      scenario: 'slow',
    });

    expect(validateConfig(config)).toEqual([]);
  });

  it('accepts an empty config', () => {
    expect(validateConfig({})).toEqual([]);
  });

  it('rejects a non-object config', () => {
    expect(validateConfig(null)).toEqual([{ path: '(root)', message: 'must be an object' }]);
  });

  it('reports every issue with its path', () => {
    expect(
      paths({
        rules: [{ delay: -1 }, { url: '', method: 'FETCH', error: { rate: 2, status: 99 } }],
        scenarios: { slow: [{ url: '/a', delay: [500, 100], timeout: { ms: Number.NaN } }] },
        scenario: 'missing',
      }),
    ).toEqual([
      'rules[0].url',
      'rules[0].delay',
      'rules[1].url',
      'rules[1].method',
      'rules[1].error.rate',
      'rules[1].error.status',
      'scenarios.slow[0].delay',
      'scenarios.slow[0].timeout.ms',
      'scenario',
    ]);
  });

  it('explains options removed in 1.0', () => {
    const issues = validateConfig({
      activeScenario: 'slow',
      rules: [{ url: '/a', errorRate: 1, errorResponse: { status: 500 }, timeoutMs: 10 }],
    });

    expect(issues).toEqual([
      { path: 'activeScenario', message: 'was removed in 1.0; use `scenario`' },
      { path: 'rules[0].errorRate', message: 'was removed in 1.0; use `error: { rate }`' },
      {
        path: 'rules[0].errorResponse',
        message: 'was removed in 1.0; use `error: { status, statusText, headers, body }`',
      },
      { path: 'rules[0].timeoutMs', message: 'was removed in 1.0; use `timeout: { ms }`' },
    ]);
  });

  it('rejects unknown keys at every level', () => {
    expect(
      paths({
        rule: [],
        rules: [{ url: '/a', retry: 1, error: { code: 1 }, timeout: { after: 1 } }],
      }),
    ).toEqual(['rule', 'rules[0].retry', 'rules[0].timeout.after', 'rules[0].error.code']);
  });

  it('rejects malformed shapes', () => {
    expect(
      paths({
        rules: {},
        scenarios: { a: 'nope', b: [42, { url: 1, error: true, timeout: 5 }] },
        scenario: 3,
      }),
    ).toEqual([
      'rules',
      'scenarios.a',
      'scenarios.b[0]',
      'scenarios.b[1].url',
      'scenarios.b[1].timeout',
      'scenarios.b[1].error',
      'scenario',
    ]);
  });
});

describe('validateEffects', () => {
  it('validates effects without url or method', () => {
    expect(validateEffects({ delay: 10, error: { status: 404 } })).toEqual([]);
    expect(validateEffects({ url: '/a' }).map((i) => i.path)).toEqual(['url']);
    expect(validateEffects({ delay: 'slow' }, 'withWaitKit').map((i) => i.path)).toEqual([
      'withWaitKit.delay',
    ]);
  });
});
