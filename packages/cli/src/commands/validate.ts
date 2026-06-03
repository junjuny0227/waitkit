import type { WaitKitRule } from '@waitkit/core';
import { validateDelay, validateRate, validateTimeoutMs } from '@waitkit/core';
import { Command } from 'commander';

import { loadConfig } from '../config/loader.js';
import type { WaitKitConfig } from '../config/types.js';
import { printError, printLine, printSuccess } from '../utils/output.js';

export async function runValidate(cwd = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);

  if (config === null) {
    printError('waitkit.config.ts not found. Run `waitkit init` to create one.');
    process.exit(1);
  }

  const errors = collectErrors(config);

  if (errors.length > 0) {
    for (const msg of errors) {
      printError(msg);
    }
    printLine('');
    printError(`${errors.length} error(s) found`);
    process.exit(1);
  }

  const scenarioCount = Object.keys(config.scenarios ?? {}).length;
  const totalRules =
    Object.values(config.scenarios ?? {}).reduce((sum, r) => sum + r.length, 0) +
    (config.rules ?? []).length;

  printSuccess(`waitkit.config.ts is valid — ${scenarioCount} scenarios, ${totalRules} rules`);
}

function collectErrors(config: WaitKitConfig): string[] {
  const errors: string[] = [];

  for (const [i, rule] of (config.rules ?? []).entries()) {
    errors.push(...validateRule(rule, `rules[${i}]`));
  }

  for (const [name, rules] of Object.entries(config.scenarios ?? {})) {
    for (const [i, rule] of rules.entries()) {
      errors.push(...validateRule(rule, `scenarios.${name}[${i}]`));
    }
  }

  if (
    config.defaultScenario !== undefined &&
    config.scenarios?.[config.defaultScenario] === undefined
  ) {
    errors.push(`defaultScenario: scenario "${config.defaultScenario}" does not exist`);
  }

  return errors;
}

function validateRule(rule: WaitKitRule, path: string): string[] {
  const errors: string[] = [];

  tryValidate(() => validateDelay(rule.delay), path, errors);
  tryValidate(() => validateRate(rule.errorRate, 'errorRate'), path, errors);
  tryValidate(() => validateRate(rule.timeoutRate, 'timeoutRate'), path, errors);
  tryValidate(() => validateTimeoutMs(rule.timeoutMs), path, errors);

  const statusMsg = validateStatus(rule.errorResponse?.status);
  if (statusMsg !== null) errors.push(`${path}: ${statusMsg}`);

  return errors;
}

function tryValidate(fn: () => void, path: string, errors: string[]): void {
  try {
    fn();
  } catch (err) {
    errors.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function validateStatus(status: number | undefined): string | null {
  if (status === undefined) return null;
  if (!Number.isInteger(status) || status < 200 || status > 599) {
    return 'errorResponse.status must be an integer between 200 and 599';
  }
  return null;
}

export function validateCommand(): Command {
  return new Command('validate')
    .description('Validate the waitkit.config.ts file')
    .action(async () => {
      await runValidate();
    });
}
