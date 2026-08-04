import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { withLoading } from './with-loading';

describe('withLoading', () => {
  describe('with a callback indicator (React-style setState)', () => {
    it('does not run the side effect before subscribe (deferred)', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const operator$ = of(1).pipe(withLoading(setLoading));

      expect(setLoading).not.toHaveBeenCalled();

      operator$.subscribe();

      expect(setLoading).toHaveBeenCalledWith(true);
    });

    it('happy path: turns true on subscribe and false after successful completion', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const values: number[] = [];

      of(1, 2, 3)
        .pipe(withLoading(setLoading))
        .subscribe((value) => values.push(value));

      expect(values).toEqual([1, 2, 3]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);
    });

    it('turns the indicator back to false when the source errors', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const onError = vi.fn();

      throwError(() => new Error('boom'))
        .pipe(withLoading(setLoading))
        .subscribe({ error: onError });

      expect(onError).toHaveBeenCalled();
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);
    });

    it('cancellation: turns the indicator back to false when unsubscribed before any emission', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(withLoading(setLoading)).subscribe();

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenCalledTimes(1);

      // Unsubscribe before the subject ever emits — proves finalize covers teardown.
      subscription.unsubscribe();

      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);

      // A value emitted after teardown must have no further effect.
      source$.next(42);
      expect(setLoading).toHaveBeenCalledTimes(2);
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('happy path: turns true on subscribe and false after successful completion', () => {
      const set = vi.fn<(value: boolean) => void>();

      of('done').pipe(withLoading({ set })).subscribe();

      expect(set).toHaveBeenNthCalledWith(1, true);
      expect(set).toHaveBeenNthCalledWith(2, false);
      expect(set).toHaveBeenCalledTimes(2);
    });

    it('turns the indicator back to false when the source errors', () => {
      const set = vi.fn<(value: boolean) => void>();

      throwError(() => new Error('boom'))
        .pipe(withLoading({ set }))
        .subscribe({ error: () => undefined });

      expect(set).toHaveBeenNthCalledWith(1, true);
      expect(set).toHaveBeenNthCalledWith(2, false);
    });

    it('cancellation: turns the indicator back to false when unsubscribed early', () => {
      const set = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(withLoading({ set })).subscribe();
      subscription.unsubscribe();

      expect(set).toHaveBeenNthCalledWith(1, true);
      expect(set).toHaveBeenNthCalledWith(2, false);
    });
  });
});
