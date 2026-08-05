import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { bindRequestState, type RequestState } from './bindRequestState';

describe('bindRequestState', () => {
  describe('with a callback indicator (React-style setState)', () => {
    it('writes the initial state synchronously at subscribe time', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const source$ = new Subject<number>();

      source$.pipe(bindRequestState(setState)).subscribe();

      expect(setState).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith({ loading: true, error: null, data: null });
    });

    it('does nothing until subscribe (defer semantics)', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();

      of(1).pipe(bindRequestState(setState));

      expect(setState).not.toHaveBeenCalled();
    });

    it('updates only `data` on each emission, keeping `loading: true`', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const source$ = new Subject<number>();

      source$.pipe(bindRequestState(setState)).subscribe();
      source$.next(1);
      source$.next(2);

      expect(setState).toHaveBeenNthCalledWith(2, { loading: true, error: null, data: 1 });
      expect(setState).toHaveBeenNthCalledWith(3, { loading: true, error: null, data: 2 });
    });

    it('forwards every emitted value downstream unchanged', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const forwarded: number[] = [];

      of(1, 2, 3)
        .pipe(bindRequestState(setState))
        .subscribe((value) => forwarded.push(value));

      expect(forwarded).toEqual([1, 2, 3]);
    });

    it('flips `loading` to false on completion, keeping the last `data` and `error: null`', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();

      of(42).pipe(bindRequestState(setState)).subscribe();

      expect(setState).toHaveBeenLastCalledWith({ loading: false, error: null, data: 42 });
    });

    it('on error: records the error, flips `loading` false, preserves the last `data`, completes gracefully by default', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const source$ = new Subject<number>();
      const onError = vi.fn();
      const onComplete = vi.fn();

      source$.pipe(bindRequestState(setState)).subscribe({ error: onError, complete: onComplete });
      source$.next(1);
      const error = new Error('network down');
      source$.error(error);

      expect(setState).toHaveBeenLastCalledWith({ loading: false, error, data: 1 });
      expect(onError).not.toHaveBeenCalled(); // swallowed by default, app does not crash
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('with { rethrow: true }: still records the error into state AND propagates it to the observer', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const error = new Error('boom');
      const onError = vi.fn();

      throwError(() => error)
        .pipe(bindRequestState(setState, { rethrow: true }))
        .subscribe({ error: onError });

      expect(setState).toHaveBeenLastCalledWith({ loading: false, error, data: null });
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('does not write a second `loading: false` after the error branch already did (no double dispatch)', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();

      throwError(() => new Error('boom'))
        .pipe(bindRequestState(setState))
        .subscribe({ error: () => undefined });

      expect(setState).toHaveBeenCalledTimes(2); // initial `loading: true`, then the error write — no third call
    });

    it('early unsubscribe flips `loading` to false immediately', () => {
      const setState = vi.fn<(value: RequestState<number>) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(bindRequestState(setState)).subscribe();
      source$.next(7);
      subscription.unsubscribe();

      expect(setState).toHaveBeenLastCalledWith({ loading: false, error: null, data: 7 });
    });

    it('two independent subscriptions do not cross-talk (fresh state per subscribe)', () => {
      const stateA = vi.fn<(value: RequestState<number>) => void>();
      const stateB = vi.fn<(value: RequestState<number>) => void>();
      const sourceA$ = new Subject<number>();
      const sourceB$ = new Subject<number>();
      const pipeline$ = (source: Subject<number>, setState: typeof stateA) =>
        source.pipe(bindRequestState(setState)).subscribe();

      pipeline$(sourceA$, stateA);
      pipeline$(sourceB$, stateB);

      sourceA$.next(100);
      sourceB$.next(200);

      expect(stateA).toHaveBeenLastCalledWith({ loading: true, error: null, data: 100 });
      expect(stateB).toHaveBeenLastCalledWith({ loading: true, error: null, data: 200 });
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('writes the composed state via .set()', () => {
      const set = vi.fn<(value: RequestState<number>) => void>();

      of(9).pipe(bindRequestState({ set })).subscribe();

      expect(set).toHaveBeenCalledWith({ loading: true, error: null, data: null });
      expect(set).toHaveBeenLastCalledWith({ loading: false, error: null, data: 9 });
    });

    it('records the error via .set() and re-throws when { rethrow: true }', () => {
      const set = vi.fn<(value: RequestState<number>) => void>();
      const error = new Error('boom');
      const onError = vi.fn();

      throwError(() => error)
        .pipe(bindRequestState({ set }, { rethrow: true }))
        .subscribe({ error: onError });

      expect(set).toHaveBeenLastCalledWith({ loading: false, error, data: null });
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
