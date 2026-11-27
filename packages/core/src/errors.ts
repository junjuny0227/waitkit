import type { WaitKitValidationIssue } from './types';

export class WaitKitTimeoutError extends Error {
  override readonly name = 'WaitKitTimeoutError';
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.timeoutMs = timeoutMs;
  }
}

export class WaitKitConfigError extends Error {
  override readonly name = 'WaitKitConfigError';
  readonly issues: readonly WaitKitValidationIssue[];

  constructor(issues: readonly WaitKitValidationIssue[]) {
    super(
      [
        `Invalid Waitkit config (${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}):`,
        ...issues.map((issue) => `  - ${issue.path}: ${issue.message}`),
      ].join('\n'),
    );
    this.issues = issues;
  }
}
