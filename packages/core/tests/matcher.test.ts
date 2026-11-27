import { describe, expect, it } from 'vitest';

import { matchesUrl } from '../src';
import { normalizeRequest, selectRule } from '../src/matcher';

const url = (href: string) => new URL(href, 'http://localhost');

describe('matchesUrl with path patterns', () => {
  it.each([
    ['/api/users', '/api/users', true],
    ['/api/users', '/api/users/', true],
    ['/api/users', '/api/users?page=2', true],
    ['/api/user', '/api/users', false],
    ['/api/user', '/api/user-settings', false],
    ['/api/users/:id', '/api/users/42', true],
    ['/api/users/:id', '/api/users/42/posts', false],
    ['/api/users/:id/posts', '/api/users/42/posts', true],
    ['/api/*', '/api/users/42', true],
    ['/api/*', '/other', false],
    ['*', '/anything/at/all', true],
    ['/files/report.pdf', '/files/reportXpdf', false],
  ])('%s vs %s → %s', (pattern, path, expected) => {
    expect(matchesUrl(pattern, url(path))).toBe(expected);
  });

  it('matches the origin when the pattern has a scheme', () => {
    expect(matchesUrl('https://api.example.com/*', url('https://api.example.com/v1/users'))).toBe(
      true,
    );
    expect(matchesUrl('https://api.example.com/*', url('https://cdn.example.com/v1/users'))).toBe(
      false,
    );
  });
});

describe('matchesUrl with RegExp and functions', () => {
  it('tests a RegExp against the absolute URL', () => {
    expect(matchesUrl(/example\.com\/api/, url('https://example.com/api/users'))).toBe(true);
  });

  it('is not affected by the lastIndex of a global RegExp', () => {
    const pattern = /users/g;
    expect(matchesUrl(pattern, url('/users'))).toBe(true);
    expect(matchesUrl(pattern, url('/users'))).toBe(true);
  });

  it('passes the parsed URL to a function matcher', () => {
    expect(matchesUrl((u) => u.searchParams.get('fail') === '1', url('/api?fail=1'))).toBe(true);
  });
});

describe('normalizeRequest', () => {
  it('resolves relative URLs and upper-cases the method', () => {
    const request = normalizeRequest('/api/users', { method: 'post' });
    expect(request.url.href).toBe('http://localhost/api/users');
    expect(request.method).toBe('POST');
  });

  it('reads the method from a Request object', () => {
    const request = normalizeRequest(new Request('https://example.com/a', { method: 'DELETE' }));
    expect(request.method).toBe('DELETE');
  });

  it('lets init.method override the Request method', () => {
    const request = normalizeRequest(new Request('https://example.com/a'), { method: 'PUT' });
    expect(request.method).toBe('PUT');
  });
});

describe('selectRule', () => {
  it('returns the first rule matching both url and method', () => {
    const rules = [
      { url: '/api/users', method: 'POST' as const, delay: 1 },
      { url: '/api/users', delay: 2 },
      { url: '/api/*', delay: 3 },
    ];

    expect(selectRule(rules, normalizeRequest('/api/users'))?.delay).toBe(2);
    expect(selectRule(rules, normalizeRequest('/api/users', { method: 'POST' }))?.delay).toBe(1);
    expect(selectRule(rules, normalizeRequest('/api/posts'))?.delay).toBe(3);
    expect(selectRule(rules, normalizeRequest('/other'))).toBeUndefined();
  });

  it('accepts a list of methods', () => {
    const rules = [{ url: '*', method: ['PUT', 'PATCH'] as const }];
    expect(selectRule(rules, normalizeRequest('/a', { method: 'patch' }))).toBeDefined();
    expect(selectRule(rules, normalizeRequest('/a'))).toBeUndefined();
  });
});
