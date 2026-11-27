import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Output } from '../output';

const TS_TEMPLATE = `import { defineConfig } from '@waitkit/core';

export default defineConfig({
  // Used while no scenario is active. Empty means every request goes to the network.
  rules: [],
  scenarios: {
    'slow-network': [{ url: '/api/*', delay: [800, 2000] }],
    'server-error': [{ url: '/api/*', error: { status: 500, body: { message: 'Internal Server Error' } } }],
    flaky: [{ url: '/api/*', error: { rate: 0.3, status: 503 } }],
    timeout: [{ url: '/api/*', timeout: { ms: 5000 } }],
  },
});
`;

export interface InitOptions {
  force?: boolean;
  file?: string;
}

/** Writes a starter config. Returns the process exit code. */
export function runInit(options: InitOptions, cwd: string, output: Output): number {
  const path = resolve(cwd, options.file ?? 'waitkit.config.ts');

  if (existsSync(path) && options.force !== true) {
    output.error(`✗ ${path} already exists. Use --force to overwrite it.`);
    return 1;
  }

  writeFileSync(path, TS_TEMPLATE, 'utf-8');
  output.log(`✓ Created ${path}`);
  return 0;
}
