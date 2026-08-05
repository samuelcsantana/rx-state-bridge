import { tap, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';

/** Options controlling {@link withTemporarySuccess}'s reset behavior. */
export interface WithTemporarySuccessOptions {
  /**
   * Cancels the pending `false` reset early. Pass an `AbortController`'s
   * signal and call `.abort()` when a newer request supersedes this one on
   * a shared indicator, or when the consumer goes away, to prevent this
   * operator's delayed write from landing on stale state.
   *
   * Without a `signal`, the reset is fire-and-forget: it always fires
   * `duration` ms after completion, even if nothing is listening anymore —
   * completion itself is *not* delayed, so this operator never blocks
   * whatever runs after `.subscribe()`.
   */
  signal?: AbortSignal;
}

/**
 * Toggles a boolean indicator to `true` when the source Observable completes
 * successfully, then automatically resets it to `false` after `duration`
 * milliseconds. Useful for transient UI feedback such as toasts, checkmarks,
 * or "saved!" banners, without requiring manual `setTimeout` bookkeeping.
 *
 * The indicator is only driven on successful completion — errors are passed
 * through untouched, so pair this with {@link catchToState} for error UX.
 *
 * Completion itself is never delayed by `duration` — this is a background
 * reset, not a blocking one. If you reuse the same indicator across
 * overlapping/sequential requests (e.g. re-running an effect for a new id),
 * pass `options.signal` so a superseded request's reset can't overwrite a
 * newer one's state; see the examples below.
 *
 * @param indicator - The state setter toggled between `true` and `false`.
 * @param duration - How long (ms) the indicator stays `true` before resetting.
 * @param options - See {@link WithTemporarySuccessOptions}.
 *
 * @example React
 * ```ts
 * const [saved, setSaved] = useState(false);
 * save$.pipe(withTemporarySuccess(setSaved, 2000)).subscribe();
 * ```
 *
 * @example React — cancelling a stale reset when `id` changes
 * ```ts
 * const [saved, setSaved] = useState(false);
 *
 * useEffect(() => {
 *   const controller = new AbortController();
 *   const sub = save$(id)
 *     .pipe(withTemporarySuccess(setSaved, 2000, { signal: controller.signal }))
 *     .subscribe();
 *   return () => {
 *     controller.abort();
 *     sub.unsubscribe();
 *   };
 * }, [id]);
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
  options: WithTemporarySuccessOptions = {},
): MonoTypeOperatorFunction<T> {
  const { signal } = options;

  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      tap({
        complete: () => {
          if (signal?.aborted) return;

          applyIndicator(indicator, true);

          const timeoutId = setTimeout(() => applyIndicator(indicator, false), duration);

          signal?.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
        },
      }),
    );
}
