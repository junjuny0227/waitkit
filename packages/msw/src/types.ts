import type { WaitKitRule } from '@waitkit/core';

export type WaitKitMswRule = Pick<
  WaitKitRule,
  'delay' | 'errorRate' | 'timeoutRate' | 'timeoutMs' | 'errorResponse'
>;
