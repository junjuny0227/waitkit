import { Command } from 'commander';

import { initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('waitkit')
  .description('CLI for managing Waitkit network simulation configurations')
  .version('0.1.0');

program.addCommand(initCommand());
program.addCommand(listCommand());
program.addCommand(validateCommand());

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
