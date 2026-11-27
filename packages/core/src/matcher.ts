import type { HttpMethod, UrlMatcher, WaitKitRule } from './types';

export interface NormalizedRequest {
  url: URL;
  method: string;
}

const FALLBACK_BASE = 'http://localhost';
const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const compiledPatterns = new Map<string, RegExp>();

/** Resolves fetch arguments to an absolute URL and an upper-case method. */
export function normalizeRequest(input: RequestInfo | URL, init?: RequestInit): NormalizedRequest {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method =
    init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');

  return {
    url: new URL(raw, globalThis.location?.href ?? FALLBACK_BASE),
    method: method.toUpperCase(),
  };
}

/** Returns the first rule matching the request; rule order is priority. */
export function selectRule<R extends WaitKitRule>(
  rules: readonly R[],
  request: NormalizedRequest,
): R | undefined {
  return rules.find(
    (rule) => matchesMethod(rule.method, request.method) && matchesUrl(rule.url, request.url),
  );
}

export function matchesUrl(matcher: UrlMatcher, url: URL): boolean {
  if (typeof matcher === 'string') {
    const target = SCHEME.test(matcher) ? `${url.origin}${url.pathname}` : url.pathname;
    return compilePattern(matcher).test(target);
  }

  if (matcher instanceof RegExp) {
    matcher.lastIndex = 0;
    return matcher.test(url.href);
  }

  return matcher(url);
}

function matchesMethod(
  expected: HttpMethod | readonly HttpMethod[] | undefined,
  method: string,
): boolean {
  if (expected === undefined) {
    return true;
  }

  const methods: readonly string[] = typeof expected === 'string' ? [expected] : expected;
  return methods.includes(method);
}

function compilePattern(pattern: string): RegExp {
  let compiled = compiledPatterns.get(pattern);

  if (compiled === undefined) {
    const source = pattern
      .replace(/\/+$/, '')
      .split(/(\*|:[A-Za-z_]\w*)/)
      .map((part) => {
        if (part === '*') return '.*';
        if (part.startsWith(':')) return '[^/]+';
        return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');

    compiled = new RegExp(`^${source}/?$`);
    compiledPatterns.set(pattern, compiled);
  }

  return compiled;
}
