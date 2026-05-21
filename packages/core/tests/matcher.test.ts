import { describe, expect, it } from 'vitest';

import { getRequestMethod, matchesRule } from '../src/matcher';

describe('matchesRule', () => {
  it('matches string URL fragments', () => {
    expect(matchesRule({ url: '/api/users' }, 'https://example.com/api/users', 'GET')).toBe(true);
  });

  it('matches string URL fragments against query strings', () => {
    expect(matchesRule({ url: 'page=2' }, 'https://example.com/api/users?page=2', 'GET')).toBe(
      true,
    );
  });

  it('matches regular expressions', () => {
    expect(
      matchesRule({ url: /^https:\/\/api\.example\.com/ }, 'https://api.example.com/users', 'GET'),
    ).toBe(true);
  });

  it('matches URL functions', () => {
    expect(
      matchesRule({ url: (url: string) => url.endsWith('/health') }, '/api/health', 'GET'),
    ).toBe(true);
  });

  it('can ignore query strings with predicate matchers', () => {
    const pathnameMatcher = (url: string) =>
      new URL(url, 'https://waitkit.test').pathname === '/api/users';

    expect(matchesRule({ url: pathnameMatcher }, '/api/users?page=2', 'GET')).toBe(true);
  });

  it('matches methods case-insensitively', () => {
    expect(matchesRule({ url: '/api', method: 'POST' }, '/api/users', 'post')).toBe(true);
  });

  it('matches method arrays', () => {
    expect(matchesRule({ url: '/api', method: ['POST', 'PATCH'] }, '/api/users', 'PATCH')).toBe(
      true,
    );
  });
});

describe('getRequestMethod', () => {
  it('uses RequestInit method before input method', () => {
    const request = new Request('https://example.com/api/users', {
      method: 'POST',
    });

    expect(getRequestMethod(request, { method: 'PATCH' })).toBe('PATCH');
  });
});
