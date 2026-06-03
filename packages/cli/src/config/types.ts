import type { WaitKitRule } from '@waitkit/core';

export interface WaitKitConfig {
  rules?: readonly WaitKitRule[];
  scenarios?: Record<string, readonly WaitKitRule[]>;
  defaultScenario?: string;
}

export function defineConfig(config: WaitKitConfig): WaitKitConfig {
  return config;
}
