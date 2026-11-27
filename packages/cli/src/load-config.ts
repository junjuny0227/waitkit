import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createJiti } from 'jiti';

export const CONFIG_FILENAMES = [
  'waitkit.config.ts',
  'waitkit.config.mts',
  'waitkit.config.cts',
  'waitkit.config.js',
  'waitkit.config.mjs',
  'waitkit.config.cjs',
] as const;

export interface LoadedConfig {
  path: string;
  /** Default export of the file. Unvalidated: pass it to `validateConfig` before use. */
  config: unknown;
}

/** Finds the config file to use: `explicitPath` if given, otherwise the first known name in `cwd`. */
export function findConfigFile(cwd: string, explicitPath?: string): string | undefined {
  if (explicitPath !== undefined) {
    const path = resolve(cwd, explicitPath);
    return existsSync(path) ? path : undefined;
  }

  return CONFIG_FILENAMES.map((name) => resolve(cwd, name)).find((path) => existsSync(path));
}

/** Loads a config file with TypeScript support. Throws when the file cannot be found. */
export async function loadConfig(cwd: string, explicitPath?: string): Promise<LoadedConfig> {
  const path = findConfigFile(cwd, explicitPath);

  if (path === undefined) {
    throw new Error(
      explicitPath === undefined
        ? `No Waitkit config found in ${cwd}. Run \`waitkit init\` to create one.`
        : `Config file not found: ${resolve(cwd, explicitPath)}`,
    );
  }

  const jiti = createJiti(import.meta.url, { moduleCache: false });
  const config = await jiti.import(path, { default: true });
  return { path, config };
}
