import type { WaitKitRule } from './types';

export function matchesRule(rule: WaitKitRule, url: string, method: string): boolean {
  return matchesUrl(rule.url, url) && matchesMethod(rule.method, method);
}

function matchesUrl(ruleUrl: WaitKitRule['url'], url: string): boolean {
  if (typeof ruleUrl === 'string') {
    return url.includes(ruleUrl);
  }

  if (ruleUrl instanceof RegExp) {
    return ruleUrl.test(url);
  }

  return ruleUrl(url);
}

function matchesMethod(ruleMethod: WaitKitRule['method'], method: string): boolean {
  if (ruleMethod === undefined) {
    return true;
  }

  const normalizedMethod = normalizeMethod(method);

  if (typeof ruleMethod === 'string') {
    return normalizeMethod(ruleMethod) === normalizedMethod;
  }

  return ruleMethod.some((item) => normalizeMethod(item) === normalizedMethod);
}

export function normalizeMethod(method: string | undefined): string {
  return (method ?? 'GET').toUpperCase();
}

export function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

export function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method !== undefined) {
    return normalizeMethod(init.method);
  }

  if (typeof input === 'string' || input instanceof URL) {
    return 'GET';
  }

  return normalizeMethod(input.method);
}
