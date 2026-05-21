import type { DelayValue } from "./types";

export function resolveDelay(delay: DelayValue | undefined): number {
  if (delay === undefined) {
    return 0;
  }

  if (typeof delay === "number") {
    return delay;
  }

  const [min, max] = delay;
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function validateDelay(delay: DelayValue | undefined): void {
  if (delay === undefined) {
    return;
  }

  if (typeof delay === "number") {
    assertNonNegativeFiniteNumber(delay, "delay");
    return;
  }

  const [min, max] = delay;
  assertNonNegativeFiniteNumber(min, "delay min");
  assertNonNegativeFiniteNumber(max, "delay max");

  if (min > max) {
    throw new Error(
      "WaitKit delay range must have min less than or equal to max.",
    );
  }
}

export function validateRate(rate: number | undefined, name: string): void {
  if (rate === undefined) {
    return;
  }

  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`WaitKit ${name} must be a number between 0 and 1.`);
  }
}

export function validateTimeoutMs(timeoutMs: number | undefined): void {
  if (timeoutMs === undefined) {
    return;
  }

  assertNonNegativeFiniteNumber(timeoutMs, "timeoutMs");
}

function assertNonNegativeFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`WaitKit ${name} must be a non-negative finite number.`);
  }
}
