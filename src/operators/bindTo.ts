import { tap, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';

/**
 * Convenience operator that pipes every emitted value directly into a state,
 * calling `state(value)` or `state.set(value)`, while still forwarding the
 * value downstream unchanged — so it can be composed with further operators
 * or a terminal `subscribe()`.
 *
 * @param state - The state setter that receives each emitted value.
 *
 * @example React
 * ```ts
 * const [data, setData] = useState<User | null>(null);
 * source$.pipe(bindTo(setData)).subscribe();
 * ```
 *
 * @example Angular
 * ```ts
 * data = signal<User | null>(null);
 * readonly data$ = source$.pipe(bindTo(this.data));
 * ```
 */
export function bindTo<T>(state: StateIndicator<T>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(tap((value) => applyIndicator(state, value)));
}
