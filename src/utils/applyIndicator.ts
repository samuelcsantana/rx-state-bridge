import type { StateIndicator } from '../types';

/**
 * Normalizes a {@link StateIndicator} invocation, supporting both the
 * callback form (`(value: T) => void`) and the `.set()` form (Signals-like).
 *
 * The `.set()` form is checked *first*. Angular's `WritableSignal` is itself
 * callable (`mySignal()` reads the current value), so `typeof indicator ===
 * 'function'` is true for signals too — checking that first would silently
 * invoke the signal as a getter with an ignored argument instead of writing
 * to it. Checking for `.set` first correctly routes both `{ set }` objects
 * and callable signals to `.set()`, and only plain callbacks (which have no
 * `.set` property) fall through to being invoked directly.
 *
 * @internal
 */
export function applyIndicator<T>(indicator: StateIndicator<T>, value: T): void {
  if (typeof (indicator as { set?: unknown }).set === 'function') {
    (indicator as { set: (value: T) => void }).set(value);
    return;
  }

  (indicator as (value: T) => void)(value);
}
