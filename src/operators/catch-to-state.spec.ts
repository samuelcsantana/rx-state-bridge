import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { catchToState } from './catch-to-state';

describe('catchToState', () => {
  describe('with a callback indicator (React-style setState)', () => {
    it('forwards values untouched when the source never errors', () => {
      const setError = vi.fn<(value: unknown) => void>();
      const values: number[] = [];

      of(1, 2, 3)
        .pipe(catchToState(setError))
        .subscribe((value) => values.push(value));

      expect(values).toEqual([1, 2, 3]);
      expect(setError).not.toHaveBeenCalled();
    });

    it('extracts the exact error instance into the state', () => {
      const setError = vi.fn<(value: unknown) => void>();
      const error = new Error('network down');

      throwError(() => error)
        .pipe(catchToState(setError))
        .subscribe();

      expect(setError).toHaveBeenCalledTimes(1);
      expect(setError).toHaveBeenCalledWith(error);
    });

    it('by default completes the stream gracefully instead of propagating the error (app does not crash)', () => {
      const setError = vi.fn<(value: unknown) => void>();
      const error = new Error('network down');
      const onError = vi.fn();
      const onComplete = vi.fn();
      const onNext = vi.fn();

      throwError(() => error)
        .pipe(catchToState(setError))
        .subscribe({ next: onNext, error: onError, complete: onComplete });

      expect(setError).toHaveBeenCalledWith(error);
      expect(onError).not.toHaveBeenCalled(); // the subscriber's error path is never hit
      expect(onNext).not.toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalledTimes(1); // stream ends safely
    });

    it('re-throws the error downstream when { rethrow: true } is passed, after recording it', () => {
      const setError = vi.fn<(value: unknown) => void>();
      const error = new Error('network down');
      const onError = vi.fn();

      throwError(() => error)
        .pipe(catchToState(setError, { rethrow: true }))
        .subscribe({ error: onError });

      expect(setError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('does not swallow errors from a source that errors mid-stream after emitting values', () => {
      const setError = vi.fn<(value: unknown) => void>();
      const source$ = new Subject<number>();
      const values: number[] = [];
      const onComplete = vi.fn();

      source$
        .pipe(catchToState(setError))
        .subscribe({ next: (value) => values.push(value), complete: onComplete });

      source$.next(1);
      source$.next(2);
      source$.error(new Error('mid-stream failure'));

      expect(values).toEqual([1, 2]);
      expect(setError).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('extracts the error into the signal', () => {
      const set = vi.fn<(value: unknown) => void>();
      const error = new Error('boom');

      throwError(() => error)
        .pipe(catchToState({ set }))
        .subscribe();

      expect(set).toHaveBeenCalledWith(error);
    });

    it('re-throws when rethrow is true', () => {
      const set = vi.fn<(value: unknown) => void>();
      const error = new Error('boom');
      const onError = vi.fn();

      throwError(() => error)
        .pipe(catchToState({ set }, { rethrow: true }))
        .subscribe({ error: onError });

      expect(set).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
