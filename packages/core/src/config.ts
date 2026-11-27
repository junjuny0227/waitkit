import type { WaitKitConfig, WaitKitValidationIssue } from './types';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);
const CONFIG_KEYS = new Set(['rules', 'scenarios', 'scenario']);
const EFFECT_KEYS = new Set(['delay', 'timeout', 'error']);
const RULE_KEYS = new Set([...EFFECT_KEYS, 'url', 'method']);
const ERROR_KEYS = new Set(['rate', 'status', 'statusText', 'headers', 'body']);
const TIMEOUT_KEYS = new Set(['rate', 'ms']);

/** Keys removed in 1.0, mapped to what replaces them. */
const REMOVED_KEYS: Record<string, string> = {
  errorRate: 'use `error: { rate }`',
  errorResponse: 'use `error: { status, statusText, headers, body }`',
  timeoutRate: 'use `timeout: { rate }`',
  timeoutMs: 'use `timeout: { ms }`',
  activeScenario: 'use `scenario`',
  defaultScenario: 'use `scenario`',
};

/** Identity helper that gives `waitkit.config.ts` files type checking. */
export function defineConfig<const T extends WaitKitConfig>(config: T): T {
  return config;
}

/**
 * Checks a config without throwing. Accepts `unknown` so a loaded config file can be
 * validated before it is trusted. Returns an empty array when the config is valid.
 */
export function validateConfig(config: unknown): WaitKitValidationIssue[] {
  const issues: WaitKitValidationIssue[] = [];

  if (!isRecord(config)) {
    issues.push({ path: '(root)', message: 'must be an object' });
    return issues;
  }

  checkKeys(config, CONFIG_KEYS, '', issues);

  if (config.rules !== undefined) {
    checkRules(config.rules, 'rules', issues);
  }

  const scenarioNames = new Set<string>();

  if (config.scenarios !== undefined) {
    if (isRecord(config.scenarios)) {
      for (const [name, rules] of Object.entries(config.scenarios)) {
        scenarioNames.add(name);
        checkRules(rules, `scenarios.${name}`, issues);
      }
    } else {
      issues.push({ path: 'scenarios', message: 'must be an object of rule arrays' });
    }
  }

  if (config.scenario !== undefined) {
    if (typeof config.scenario !== 'string') {
      issues.push({ path: 'scenario', message: 'must be a string' });
    } else if (!scenarioNames.has(config.scenario)) {
      issues.push({
        path: 'scenario',
        message: `"${config.scenario}" is not defined in scenarios`,
      });
    }
  }

  return issues;
}

/** Type guard form of `validateConfig`. */
export function isWaitKitConfig(config: unknown): config is WaitKitConfig {
  return validateConfig(config).length === 0;
}

/** Checks the effect fields shared by rules and adapters such as `@waitkit/msw`. */
export function validateEffects(effects: unknown, path = ''): WaitKitValidationIssue[] {
  const issues: WaitKitValidationIssue[] = [];

  if (!isRecord(effects)) {
    issues.push({ path: path || '(root)', message: 'must be an object' });
    return issues;
  }

  checkKeys(effects, EFFECT_KEYS, path, issues);
  checkEffects(effects, path, issues);
  return issues;
}

function checkRules(rules: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (!Array.isArray(rules)) {
    issues.push({ path, message: 'must be an array of rules' });
    return;
  }

  rules.forEach((rule: unknown, index) => {
    const rulePath = `${path}[${index}]`;

    if (!isRecord(rule)) {
      issues.push({ path: rulePath, message: 'must be an object' });
      return;
    }

    checkKeys(rule, RULE_KEYS, rulePath, issues);
    checkUrl(rule.url, `${rulePath}.url`, issues);
    checkMethod(rule.method, `${rulePath}.method`, issues);
    checkEffects(rule, rulePath, issues);
  });
}

function checkEffects(
  effects: Record<string, unknown>,
  path: string,
  issues: WaitKitValidationIssue[],
): void {
  const at = (key: string) => (path ? `${path}.${key}` : key);

  checkDelay(effects.delay, at('delay'), issues);

  const timeout = effects.timeout;
  if (timeout !== undefined) {
    if (isRecord(timeout)) {
      checkKeys(timeout, TIMEOUT_KEYS, at('timeout'), issues);
      checkRate(timeout.rate, at('timeout.rate'), issues);
      checkDuration(timeout.ms, at('timeout.ms'), issues);
    } else {
      issues.push({ path: at('timeout'), message: 'must be an object, e.g. `{ ms: 3000 }`' });
    }
  }

  const error = effects.error;
  if (error !== undefined) {
    if (isRecord(error)) {
      checkKeys(error, ERROR_KEYS, at('error'), issues);
      checkRate(error.rate, at('error.rate'), issues);
      checkStatus(error.status, at('error.status'), issues);

      if (error.statusText !== undefined && typeof error.statusText !== 'string') {
        issues.push({ path: at('error.statusText'), message: 'must be a string' });
      }
    } else {
      issues.push({ path: at('error'), message: 'must be an object, e.g. `{ status: 500 }`' });
    }
  }
}

function checkKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
  issues: WaitKitValidationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) continue;

    const removed = REMOVED_KEYS[key];
    issues.push({
      path: path ? `${path}.${key}` : key,
      message: removed === undefined ? 'is not a known option' : `was removed in 1.0; ${removed}`,
    });
  }
}

function checkUrl(url: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (url === undefined) {
    issues.push({ path, message: 'is required' });
  } else if (typeof url === 'string') {
    if (url.length === 0) issues.push({ path, message: 'must not be empty' });
  } else if (!(url instanceof RegExp) && typeof url !== 'function') {
    issues.push({ path, message: 'must be a path pattern string, a RegExp, or a function' });
  }
}

function checkMethod(method: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (method === undefined) return;

  const methods = Array.isArray(method) ? method : [method];
  for (const item of methods) {
    if (typeof item !== 'string' || !HTTP_METHODS.has(item)) {
      issues.push({
        path,
        message: `must be one of ${[...HTTP_METHODS].join(', ')} (got ${JSON.stringify(item)})`,
      });
    }
  }
}

function checkDelay(delay: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (delay === undefined) return;

  if (typeof delay === 'number') {
    checkDuration(delay, path, issues);
    return;
  }

  if (
    !Array.isArray(delay) ||
    delay.length !== 2 ||
    !isDuration(delay[0]) ||
    !isDuration(delay[1])
  ) {
    issues.push({ path, message: 'must be a non-negative number or a [min, max] tuple' });
  } else if (delay[0] > delay[1]) {
    issues.push({ path, message: 'range min must be less than or equal to max' });
  }
}

function checkDuration(value: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (value !== undefined && !isDuration(value)) {
    issues.push({ path, message: 'must be a non-negative finite number of milliseconds' });
  }
}

function checkRate(rate: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (rate === undefined) return;

  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) {
    issues.push({ path, message: 'must be a number between 0 and 1' });
  }
}

function checkStatus(status: unknown, path: string, issues: WaitKitValidationIssue[]): void {
  if (status === undefined) return;

  if (typeof status !== 'number' || !Number.isInteger(status) || status < 200 || status > 599) {
    issues.push({ path, message: 'must be an integer between 200 and 599' });
  }
}

function isDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
