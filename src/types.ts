/**
 * A universal state setter abstraction.
 *
 * Accepts either a plain callback (e.g. React's `setState` from `useState`)
 * or an object exposing a `.set()` method (e.g. Angular's `WritableSignal`).
 *
 * @example React
 * ```ts
 * const [loading, setLoading] = useState(false);
 * source$.pipe(withLoading(setLoading));
 * ```
 *
 * @example Angular
 * ```ts
 * loading = signal(false);
 * source$.pipe(withLoading(this.loading));
 * ```
 */
export type StateIndicator<T> = ((value: T) => void) | { set: (value: T) => void };
