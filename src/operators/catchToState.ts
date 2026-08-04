import { catchError, EMPTY, throwError, type Observable, type OperatorFunction } from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';

/** Options controlling {@link catchToState}'s behavior after an error is captured. */
export interface CatchToStateOptions {
  /**
   * When `true`, the original error is re-thrown downstream after being
   * recorded in `errorIndicator`, so consumers can still react to it (e.g.
   * via a further `catchError` or the Observable's `error` callback).
   *
   * Defaults to `false`, which completes the stream gracefully instead —
   * ideal when the error indicator itself is the only UI feedback needed.
   */
  rethrow?: boolean;
}

/**
 * Captures errors from the source stream, forwards them to an
 * `errorIndicator` state, and then either re-throws the error or completes
 * gracefully so a single unhandled error doesn't tear down long-lived
 * subscriptions (e.g. a store or a shared stream).
 *
 * @param errorIndicator - The state setter that receives the captured error.
 * @param options - See {@link CatchToStateOptions}.
 *
 * @example React
 * ```ts
 * const [error, setError] = useState<unknown>(null);
 * source$.pipe(catchToState(setError)).subscribe(setData);
 * ```
 *
 * @example Angular
 * ```ts
 * error = signal<unknown>(null);
 * readonly data$ = source$.pipe(catchToState(this.error));
 * ```
 */
export function catchToState<T>(
  errorIndicator: StateIndicator<unknown>,
  options: CatchToStateOptions = {},
): OperatorFunction<T, T> {
  const { rethrow = false } = options;

  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      catchError((error: unknown) => {
        applyIndicator(errorIndicator, error);
        return rethrow ? throwError(() => error) : EMPTY;
      }),
    );
}
