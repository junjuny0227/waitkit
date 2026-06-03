import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Command } from 'commander';

import { printError, printSuccess } from '../utils/output.js';

const CONFIG_FILENAME = 'waitkit.config.ts';

const TEMPLATE = `import { defineConfig } from '@waitkit/cli';

export default defineConfig({
  scenarios: {
    'slow-network': [{ url: /\\/api\\//, delay: 2000 }],
    'server-error': [
      {
        url: /\\/api\\//,
        errorRate: 1,
        errorResponse: { status: 500, body: { message: 'Internal Server Error' } },
      },
    ],
    timeout: [{ url: /\\/api\\//, timeoutRate: 1, timeoutMs: 3000 }],
  },
});
`;

export function runInit(options: { force?: boolean }, cwd = process.cwd()): void {
  const configPath = resolve(cwd, CONFIG_FILENAME);

  if (existsSync(configPath) && !options.force) {
    printError(`${CONFIG_FILENAME} already exists. Use --force to overwrite.`);
    process.exit(1);
  }

  writeFileSync(configPath, TEMPLATE, 'utf-8');
  printSuccess(`Created ${CONFIG_FILENAME}`);
}

export function initCommand(): Command {
  return new Command('init')
    .description('Create a waitkit.config.ts file with example scenarios')
    .option('--force', 'Overwrite existing config file')
    .action((options: { force?: boolean }) => {
      runInit(options);
    });
}
