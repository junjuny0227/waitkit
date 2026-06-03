import { Command } from 'commander';

import { loadConfig } from '../config/loader.js';
import { printError, printLine } from '../utils/output.js';

export async function runList(cwd = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);

  if (config === null) {
    printError('waitkit.config.ts not found. Run `waitkit init` to create one.');
    process.exit(1);
  }

  const scenarioEntries = Object.entries(config.scenarios ?? {});
  const ruleCount = (config.rules ?? []).length;

  if (scenarioEntries.length === 0 && ruleCount === 0) {
    printLine('No scenarios or rules defined.');
    return;
  }

  if (scenarioEntries.length > 0) {
    printLine(`Scenarios (${scenarioEntries.length}):`);
    for (const [name, rules] of scenarioEntries) {
      const suffix = config.defaultScenario === name ? ' (default)' : '';
      printLine(
        `  • ${name}   (${rules.length} ${rules.length === 1 ? 'rule' : 'rules'})${suffix}`,
      );
    }
  }

  if (ruleCount > 0) {
    printLine('');
    printLine(`Default rules: ${ruleCount}`);
  }
}

export function listCommand(): Command {
  return new Command('list')
    .description('List scenarios defined in waitkit.config.ts')
    .action(async () => {
      await runList();
    });
}
