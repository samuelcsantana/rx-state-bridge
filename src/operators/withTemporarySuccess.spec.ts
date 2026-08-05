import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withTemporarySuccess } from './withTemporarySuccess';

const DURATION = 2000;

describe('withTemporarySuccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with a callback indicator (React-style setState)', () => {
    it('does not turn the indicator on at subscribe time', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<string>();

      source$.pipe(withTemporarySuccess(setSaved, DURATION)).subscribe();

      expect(setSaved).not.toHaveBeenCalled();
    });

    it('turns the indicator on only after the source completes', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<string>();

      source$.pipe(withTemporarySuccess(setSaved, DURATION)).subscribe();

      source$.next('saved');
      expect(setSaved).not.toHaveBeenCalled(); // emitting a value alone must not trigger it

      source$.complete();
      expect(setSaved).toHaveBeenNthCalledWith(1, true);
      expect(setSaved).toHaveBeenCalledTimes(1);
    });

    it('turns the indicator off automatically exactly `duration` ms after completion', () => {
      const setSaved = vi.fn<(value: boolean) => void>();

      of('saved').pipe(withTemporarySuccess(setSaved, DURATION)).subscribe();

      expect(setSaved).toHaveBeenNthCalledWith(1, true);

      vi.advanceTimersByTime(DURATION - 1);
      expect(setSaved).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(setSaved).toHaveBeenNthCalledWith(2, false);
      expect(setSaved).toHaveBeenCalledTimes(2);
    });

    it('never activates the success indicator when the source errors', () => {
      const setSaved = vi.fn<(value: boolean) => void>();

      throwError(() => new Error('boom'))
        .pipe(withTemporarySuccess(setSaved, DURATION))
        .subscribe({ error: () => undefined });

      vi.advanceTimersByTime(DURATION);

      expect(setSaved).not.toHaveBeenCalled();
    });

    it('with { signal }: aborting before duration elapses cancels the pending reset', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const controller = new AbortController();

      of('saved')
        .pipe(withTemporarySuccess(setSaved, DURATION, { signal: controller.signal }))
        .subscribe();

      expect(setSaved).toHaveBeenNthCalledWith(1, true);
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(DURATION / 2);
      controller.abort();

      expect(vi.getTimerCount()).toBe(0); // the setTimeout must actually be cleared
      expect(setSaved).toHaveBeenCalledTimes(1); // no `false` write follows the abort

      vi.advanceTimersByTime(DURATION);
      expect(setSaved).toHaveBeenCalledTimes(1); // still nothing — proves it was really cancelled, not just delayed
    });

    it('with { signal }: aborting AFTER the reset already fired is a harmless no-op', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const controller = new AbortController();

      of('saved')
        .pipe(withTemporarySuccess(setSaved, DURATION, { signal: controller.signal }))
        .subscribe();

      vi.advanceTimersByTime(DURATION);
      expect(setSaved).toHaveBeenNthCalledWith(2, false);
      expect(setSaved).toHaveBeenCalledTimes(2);

      controller.abort();
      expect(setSaved).toHaveBeenCalledTimes(2); // no extra call, no error thrown
    });

    it('with { signal }: an already-aborted signal at completion time skips the indicator entirely', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const controller = new AbortController();
      controller.abort();

      of('saved')
        .pipe(withTemporarySuccess(setSaved, DURATION, { signal: controller.signal }))
        .subscribe();

      expect(setSaved).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);

      vi.advanceTimersByTime(DURATION);
      expect(setSaved).not.toHaveBeenCalled();
    });

    it('without a signal, behavior is byte-for-byte identical to the no-options default (non-breaking)', () => {
      const setSaved = vi.fn<(value: boolean) => void>();

      of('saved').pipe(withTemporarySuccess(setSaved, DURATION)).subscribe();

      expect(setSaved).toHaveBeenNthCalledWith(1, true);
      vi.advanceTimersByTime(DURATION);
      expect(setSaved).toHaveBeenNthCalledWith(2, false);
      expect(setSaved).toHaveBeenCalledTimes(2);
    });

    it('never activates the success indicator when unsubscribed before completion', () => {
      const setSaved = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(withTemporarySuccess(setSaved, DURATION)).subscribe();
      subscription.unsubscribe();

      vi.advanceTimersByTime(DURATION);

      expect(setSaved).not.toHaveBeenCalled();
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('turns on after completion and off again after `duration` ms', () => {
      const set = vi.fn<(value: boolean) => void>();

      of('saved').pipe(withTemporarySuccess({ set }, DURATION)).subscribe();

      expect(set).toHaveBeenNthCalledWith(1, true);
      expect(set).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(DURATION);
      expect(set).toHaveBeenNthCalledWith(2, false);
    });

    it('never activates on error', () => {
      const set = vi.fn<(value: boolean) => void>();

      throwError(() => new Error('boom'))
        .pipe(withTemporarySuccess({ set }, DURATION))
        .subscribe({ error: () => undefined });

      vi.advanceTimersByTime(DURATION);

      expect(set).not.toHaveBeenCalled();
    });
  });
});
