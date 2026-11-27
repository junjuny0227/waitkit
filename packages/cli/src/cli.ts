#!/usr/bin/env node
import { resolve } from 'node:path';

import { Command } from 'commander';

import pkg from '../package.json' with { type: 'json' };
import { runList, runValidate } from './commands/config';
import { runInit } from './commands/init';
import { consoleOutput } from './output';

const program = new Command()
  .name('waitkit')
  .description('Create, list, and validate Waitkit config files')
  .version(pkg.version)
  .option('-C, --cwd <dir>', 'directory to run in (default: current directory)');

const cwd = (): string => resolve(program.opts<{ cwd?: string }>().cwd ?? '.');

program
  .command('init')
  .description('create a waitkit.config.ts with example scenarios')
  .option('-f, --force', 'overwrite an existing file')
  .option('--file <path>', 'file to create', 'waitkit.config.ts')
  .action((options: { force?: boolean; file: string }) => {
    process.exitCode = runInit(options, cwd(), consoleOutput);
  });

program
  .command('list')
  .description('print the rules and scenarios in the config')
  .option('-c, --config <path>', 'config file (default: waitkit.config.{ts,mts,cts,js,mjs,cjs})')
  .action(async (options: { config?: string }) => {
    process.exitCode = await runList(options, cwd(), consoleOutput);
  });

program
  .command('validate')
  .description('check the config and report every issue')
  .option('-c, --config <path>', 'config file (default: waitkit.config.{ts,mts,cts,js,mjs,cjs})')
  .action(async (options: { config?: string }) => {
    process.exitCode = await runValidate(options, cwd(), consoleOutput);
  });

await program.parseAsync();
