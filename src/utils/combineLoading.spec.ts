import { describe, expect, it } from 'vitest';
import { combineLoading } from './combineLoading';

describe('combineLoading', () => {
  it('returns false when all values are false', () => {
    expect(combineLoading(false, false, false)).toBe(false);
  });

  it('returns true when at least one value is true', () => {
    expect(combineLoading(false, true, false)).toBe(true);
  });

  it('returns true when every value is true', () => {
    expect(combineLoading(true, true)).toBe(true);
  });

  it('returns false when called with no arguments', () => {
    expect(combineLoading()).toBe(false);
  });

  it('passes a single value through unchanged', () => {
    expect(combineLoading(true)).toBe(true);
    expect(combineLoading(false)).toBe(false);
  });
});
