import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createJiti } from 'jiti';

import type { WaitKitConfig } from './types.js';

const CONFIG_FILENAMES = [
  'waitkit.config.ts',
  'waitkit.config.mts',
  'waitkit.config.js',
  'waitkit.config.mjs',
];

export async function loadConfig(cwd: string): Promise<WaitKitConfig | null> {
  const jiti = createJiti(import.meta.url);

  for (const filename of CONFIG_FILENAMES) {
    const filePath = resolve(cwd, filename);

    if (!existsSync(filePath)) {
      continue;
    }

    const mod = (await jiti.import(filePath, { default: true })) as
      | WaitKitConfig
      | { default?: WaitKitConfig };

    return mod != null && typeof mod === 'object' && 'default' in mod && mod.default !== undefined
      ? mod.default
      : (mod as WaitKitConfig);
  }

  return null;
}
