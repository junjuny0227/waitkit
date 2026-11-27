import { isWaitKitConfig, validateConfig, type WaitKitConfig } from '@waitkit/core';

import { loadConfig } from '../load-config';
import { describeRule, type Output } from '../output';

export interface ConfigOptions {
  config?: string;
}

/** Loads and validates the config, reporting problems to `output`. */
export async function loadValidConfig(
  options: ConfigOptions,
  cwd: string,
  output: Output,
): Promise<{ path: string; config: WaitKitConfig } | undefined> {
  let loaded;
  try {
    loaded = await loadConfig(cwd, options.config);
  } catch (error) {
    output.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }

  const { path, config } = loaded;
  if (!isWaitKitConfig(config)) {
    const issues = validateConfig(config);
    output.error(`✗ ${path} has ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}:`);
    for (const issue of issues) {
      output.error(`  ${issue.path}: ${issue.message}`);
    }
    return undefined;
  }

  return { path, config };
}

/** Validates the config file. Returns the process exit code. */
export async function runValidate(
  options: ConfigOptions,
  cwd: string,
  output: Output,
): Promise<number> {
  const result = await loadValidConfig(options, cwd, output);
  if (result === undefined) return 1;

  const scenarioCount = Object.keys(result.config.scenarios ?? {}).length;
  output.log(
    `✓ ${result.path} is valid (${result.config.rules?.length ?? 0} base rules, ${scenarioCount} scenarios)`,
  );
  return 0;
}

/** Prints the rules and scenarios in the config file. Returns the process exit code. */
export async function runList(
  options: ConfigOptions,
  cwd: string,
  output: Output,
): Promise<number> {
  const result = await loadValidConfig(options, cwd, output);
  if (result === undefined) return 1;

  const { config } = result;
  const rules = config.rules ?? [];
  const scenarios = Object.entries(config.scenarios ?? {});

  output.log(`Base rules (${rules.length})`);
  for (const rule of rules) output.log(`  ${describeRule(rule)}`);

  for (const [name, scenarioRules] of scenarios) {
    output.log('');
    output.log(`Scenario "${name}"${config.scenario === name ? ' (active at startup)' : ''}`);
    for (const rule of scenarioRules) output.log(`  ${describeRule(rule)}`);
  }

  return 0;
}
