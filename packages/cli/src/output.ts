import {
  DEFAULT_ERROR_STATUS,
  DEFAULT_TIMEOUT_MS,
  type WaitKitEffects,
  type WaitKitRule,
} from '@waitkit/core';

/** Where commands write. Injected so commands stay testable without spying on `console`. */
export interface Output {
  log: (line: string) => void;
  error: (line: string) => void;
}

export const consoleOutput: Output = {
  log: (line) => console.log(line),
  error: (line) => console.error(line),
};

export function describeRule(rule: WaitKitRule): string {
  const methods = rule.method === undefined ? '*' : [rule.method].flat().join(',');
  return `${methods} ${describeUrl(rule.url)} → ${describeEffects(rule)}`;
}

function describeUrl(url: WaitKitRule['url']): string {
  if (typeof url === 'string') return url;
  if (url instanceof RegExp) return url.toString();
  return '(function)';
}

function describeEffects(effects: WaitKitEffects): string {
  const parts: string[] = [];

  if (effects.delay !== undefined) {
    parts.push(
      typeof effects.delay === 'number'
        ? `delay ${effects.delay}ms`
        : `delay ${effects.delay[0]}–${effects.delay[1]}ms`,
    );
  }

  if (effects.timeout !== undefined) {
    parts.push(
      `timeout ${effects.timeout.ms ?? DEFAULT_TIMEOUT_MS}ms${describeRate(effects.timeout.rate)}`,
    );
  }

  if (effects.error !== undefined) {
    parts.push(
      `error ${effects.error.status ?? DEFAULT_ERROR_STATUS}${describeRate(effects.error.rate)}`,
    );
  }

  return parts.length === 0 ? 'passthrough' : parts.join(', ');
}

function describeRate(rate: number | undefined): string {
  return rate === undefined || rate >= 1 ? '' : ` (${Math.round(rate * 100)}%)`;
}
