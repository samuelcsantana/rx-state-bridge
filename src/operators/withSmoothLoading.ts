import { defer, finalize, tap, timer, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';

/**
 * Like {@link withLoading}, but prevents the "flicker" UX problem where a
 * loading spinner appears and disappears too fast to be perceived (e.g. a
 * request that resolves in 50ms).
 *
 * The indicator is set to `true` at subscribe time. Behavior on teardown
 * depends on *why* the stream ended:
 *
 * - **Natural termination** (the source completes or errors): the elapsed
 *   time is compared against `minDuration`. If the stream finished before
 *   the minimum has elapsed, turning the indicator back to `false` is
 *   delayed until the remainder has passed (a single self-clearing
 *   `timer`). If the minimum was already met, it turns off immediately.
 * - **Explicit early unsubscribe** (e.g. component unmount, a `switchMap`
 *   cancelling a stale request): the grace-period timer is never created in
 *   the first place and the indicator is reset to `false` immediately —
 *   there is nothing left running in the background to leak.
 *
 * @param indicator - The state setter toggled between `true` and `false`.
 * @param minDuration - Minimum time (ms) the loading indicator must stay `true`.
 *
 * @example React
 * ```ts
 * const [loading, setLoading] = useState(false);
 * source$.pipe(withSmoothLoading(setLoading, 500)).subscribe(setData);
 * ```
 *
 * @example Angular
 * ```ts
 * loading = signal(false);
 * readonly data$ = source$.pipe(withSmoothLoading(this.loading, 500));
 * ```
 */
export function withSmoothLoading<T>(
  indicator: StateIndicator<boolean>,
  minDuration: number,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      applyIndicator(indicator, true);
      const startedAt = Date.now();
      let settled = false;

      return source.pipe(
        tap({
          complete: () => {
            settled = true;
          },
          error: () => {
            settled = true;
          },
        }),
        finalize(() => {
          if (!settled) {
            applyIndicator(indicator, false);
            return;
          }

          const elapsed = Date.now() - startedAt;
          const remaining = minDuration - elapsed;

          if (remaining <= 0) {
            applyIndicator(indicator, false);
            return;
          }

          timer(remaining).subscribe(() => applyIndicator(indicator, false));
        }),
      );
    });
}
