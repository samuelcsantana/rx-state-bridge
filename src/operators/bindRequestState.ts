import {
  catchError,
  defer,
  EMPTY,
  finalize,
  tap,
  throwError,
  type Observable,
  type OperatorFunction,
} from 'rxjs';
import type { StateIndicator } from '../types';
import { applyIndicator } from '../utils/applyIndicator';
import type { CatchToStateOptions } from './catchToState';

/** The combined shape {@link bindRequestState} writes into a single indicator. */
export interface RequestState<T> {
  /** `true` from subscribe until the stream settles (completes, errors, or is unsubscribed). */
  loading: boolean;
  /** The last error caught from the source, or `null` if none occurred yet. */
  error: unknown;
  /** The last value emitted by the source, or `null` if none has arrived yet. */
  data: T | null;
}

/**
 * Fuses {@link withLoading}, {@link catchToState}, and {@link bindTo} into a
 * single operator that writes one composed `{ loading, error, data }` object
 * into a single indicator, instead of wiring three separate state setters
 * for the common "fetch a resource" pattern.
 *
 * `data` is only ever overwritten by a new emission — an error never clears
 * a previously-received value, so the last good result stays visible
 * alongside the error.
 *
 * @param indicator - The state setter that receives the combined `RequestState<T>`.
 * @param options - See {@link CatchToStateOptions}; controls whether a caught
 *   error is also re-thrown downstream after being recorded (default: no).
 *
 * @example React
 * ```ts
 * const [user, setUser] = useState<RequestState<User>>({ loading: false, error: null, data: null });
 *
 * useEffect(() => {
 *   const sub = fetchUser$(id).pipe(bindRequestState(setUser)).subscribe();
 *   return () => sub.unsubscribe();
 * }, [id]);
 * ```
 *
 * @example Angular
 * ```ts
 * user = signal<RequestState<User>>({ loading: false, error: null, data: null });
 * readonly user$ = this.fetchUser(this.id).pipe(bindRequestState(this.user));
 * ```
 */
export function bindRequestState<T>(
  indicator: StateIndicator<RequestState<T>>,
  options: CatchToStateOptions = {},
): OperatorFunction<T, T> {
  const { rethrow = false } = options;

  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      let state: RequestState<T> = { loading: true, error: null, data: null };
      applyIndicator(indicator, state);

      return source.pipe(
        tap({
          next: (value) => {
            state = { ...state, data: value };
            applyIndicator(indicator, state);
          },
        }),
        catchError((error: unknown) => {
          state = { ...state, loading: false, error };
          applyIndicator(indicator, state);
          return rethrow ? throwError(() => error) : EMPTY;
        }),
        finalize(() => {
          if (state.loading) {
            state = { ...state, loading: false };
            applyIndicator(indicator, state);
          }
        }),
      );
    });
}
