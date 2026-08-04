import { defer, finalize, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';

/**
 * Drives a boolean loading indicator around a source Observable's lifecycle.
 *
 * The indicator is set to `true` exactly at subscribe time (via `defer`, so
 * nothing runs until a consumer actually subscribes) and is guaranteed to be
 * set back to `false` when the stream ends — on success, error, or early
 * unsubscription — via `finalize`.
 *
 * @param indicator - The state setter toggled between `true` and `false`.
 *
 * @example React
 * ```ts
 * const [loading, setLoading] = useState(false);
 *
 * useEffect(() => {
 *   const sub = fetchUser$(id).pipe(withLoading(setLoading)).subscribe(setUser);
 *   return () => sub.unsubscribe();
 * }, [id]);
 * ```
 *
 * @example Angular
 * ```ts
 * loading = signal(false);
 *
 * readonly user$ = this.fetchUser$(this.id).pipe(withLoading(this.loading));
 * ```
 */
export function withLoading<T>(indicator: StateIndicator<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      applyIndicator(indicator, true);
      return source;
    }).pipe(finalize(() => applyIndicator(indicator, false)));
}
