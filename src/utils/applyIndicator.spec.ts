import { describe, expect, it, vi } from 'vitest';
import { applyIndicator } from './applyIndicator';

/**
 * Mimics the exact shape of an Angular `WritableSignal`: callable (reading
 * with no args returns the current value) AND carrying a `.set()` method.
 * Built by hand instead of importing `@angular/core` — this package has no
 * runtime dependencies beyond the RxJS peer, and shouldn't gain a devDependency
 * just to prove this one shape works.
 */
function createFakeSignal<T>(initial: T): { (): T; set: (value: T) => void } {
  let current = initial;
  const read = (() => current) as { (): T; set: (value: T) => void };
  read.set = (value: T) => {
    current = value;
  };
  return read;
}

describe('applyIndicator', () => {
  it('invokes a plain callback function directly', () => {
    const callback = vi.fn();
    applyIndicator(callback, 42);
    expect(callback).toHaveBeenCalledWith(42);
  });

  it('calls .set() on a plain { set } object (not callable)', () => {
    const set = vi.fn();
    applyIndicator({ set }, 'hello');
    expect(set).toHaveBeenCalledWith('hello');
  });

  it('BUG REGRESSION: calls .set() on a callable Angular-style signal, not the callable itself', () => {
    const fakeSignal = createFakeSignal(false);
    expect(fakeSignal()).toBe(false);

    applyIndicator(fakeSignal, true);

    // The critical assertion: the signal's underlying value actually
    // changed. Before the fix, `typeof fakeSignal === 'function'` was
    // checked first, so applyIndicator called `fakeSignal(true)` — which,
    // like a real Angular signal, silently ignores the argument and just
    // returns the current value, making this a permanent no-op.
    expect(fakeSignal()).toBe(true);
  });

  it('never invokes a callable signal as a plain function with the value', () => {
    let calledAsPlainFunctionWith: unknown = 'not called';
    const fakeSignal = (() => false) as { (): boolean; set: (value: boolean) => void };
    // Wrap to detect a direct call vs. a .set() call.
    const spySignal = ((...args: unknown[]) => {
      if (args.length > 0) calledAsPlainFunctionWith = args[0];
      return fakeSignal();
    }) as { (): boolean; set: (value: boolean) => void };
    spySignal.set = vi.fn();

    applyIndicator(spySignal, true);

    expect(spySignal.set).toHaveBeenCalledWith(true);
    expect(calledAsPlainFunctionWith).toBe('not called');
  });
});
