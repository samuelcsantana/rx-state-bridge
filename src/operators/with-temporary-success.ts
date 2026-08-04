import { tap, timer, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/apply-indicator';

/**
 * Toggles a boolean indicator to `true` when the source Observable completes
 * successfully, then automatically resets it to `false` after `duration`
 * milliseconds. Useful for transient UI feedback such as toasts, checkmarks,
 * or "saved!" banners, without requiring manual `setTimeout` bookkeeping.
 *
 * The indicator is only driven on successful completion — errors are passed
 * through untouched, so pair this with {@link catchToState} for error UX.
 *
 * @param indicator - The state setter toggled between `true` and `false`.
 * @param duration - How long (ms) the indicator stays `true` before resetting.
 *
 * @example React
 * ```ts
 * const [saved, setSaved] = useState(false);
 * save$.pipe(withTemporarySuccess(setSaved, 2000)).subscribe();
 * ```
 *
 * @example Angular
 * ```ts
 * saved = signal(false);
 * readonly save$ = this.save().pipe(withTemporarySuccess(this.saved, 2000));
 * ```
 */
export function withTemporarySuccess<T>(
  indicator: StateIndicator<boolean>,
  duration: number,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      tap({
        complete: () => {
          applyIndicator(indicator, true);
          timer(duration).subscribe(() => applyIndicator(indicator, false));
        },
      }),
    );
}
