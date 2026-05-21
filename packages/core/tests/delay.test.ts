import { describe, expect, it, vi } from 'vitest';

import { resolveDelay, validateDelay, validateRate } from '../src/delay';

describe('resolveDelay', () => {
  it('returns fixed delays', () => {
    expect(resolveDelay(1200)).toBe(1200);
  });

  it('returns random delays inside the configured range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(resolveDelay([100, 200])).toBe(150);
  });

  it('can return the upper bound of a random delay range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    expect(resolveDelay([100, 200])).toBe(200);
  });
});

describe('validateDelay', () => {
  it('rejects negative delays', () => {
    expect(() => validateDelay(-1)).toThrow('non-negative');
  });

  it('rejects inverted delay ranges', () => {
    expect(() => validateDelay([300, 100])).toThrow('min less than or equal to max');
  });
});

describe('validateRate', () => {
  it('rejects rates outside 0 and 1', () => {
    expect(() => validateRate(1.1, 'errorRate')).toThrow('between 0 and 1');
  });
});
