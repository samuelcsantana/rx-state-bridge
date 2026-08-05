import { defer, Observable, type MonoTypeOperatorFunction } from 'rxjs';
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
 *   the minimum has elapsed, both the indicator flip *and* the downstream
 *   completion/error notification are held until the remainder has passed
 *   (bounded by `minDuration`). If the minimum was already met, both fire
 *   immediately.
 * - **Explicit early unsubscribe** (e.g. component unmount, a `switchMap`
 *   cancelling a stale request) — whether that happens before the source
 *   settles *or* during the grace-period wait above: the pending timer is
 *   cancelled and the indicator is reset to `false` immediately. There is
 *   nothing left running in the background to leak, and nothing can write
 *   a stale value into an indicator you've already moved on from.
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

      return new Observable<T>((subscriber) => {
        let graceTimer: ReturnType<typeof setTimeout> | undefined;
        let resolved = false;

        // Idempotent: safe to call once from the natural settle path below
        // and again from the teardown function without double-firing.
        const finish = () => {
          if (resolved) return;
          resolved = true;
          if (graceTimer !== undefined) clearTimeout(graceTimer);
          applyIndicator(indicator, false);
        };

        const settle = (emit: () => void) => {
          const remaining = minDuration - (Date.now() - startedAt);

          if (remaining <= 0) {
            finish();
            emit();
            return;
          }

          graceTimer = setTimeout(() => {
            graceTimer = undefined;
            finish();
            emit();
          }, remaining);
        };

        const sourceSubscription = source.subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => settle(() => subscriber.error(err)),
          complete: () => settle(() => subscriber.complete()),
        });

        return () => {
          sourceSubscription.unsubscribe();
          finish();
        };
      });
    });
}
