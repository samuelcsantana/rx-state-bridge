import type { StateIndicator } from '../types';

/**
 * Normalizes a {@link StateIndicator} invocation, supporting both the
 * callback form (`(value: T) => void`) and the `.set()` form (Signals-like).
 *
 * @internal
 */
export function applyIndicator<T>(indicator: StateIndicator<T>, value: T): void {
  if (typeof indicator === 'function') {
    indicator(value);
    return;
  }

  indicator.set(value);
}
