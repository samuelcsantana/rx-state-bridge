import { Subject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withSmoothLoading } from './with-smooth-loading';

const MIN_DURATION = 500;

describe('withSmoothLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Fail loudly if any test leaves a scheduled timer behind.
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  describe('with a callback indicator (React-style setState)', () => {
    it('Cenario A — fast request (50ms): keeps loading true until minDuration is reached', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<string>();

      source$.pipe(withSmoothLoading(setLoading, MIN_DURATION)).subscribe();

      vi.advanceTimersByTime(50);
      source$.next('fast');
      source$.complete();

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1); // the grace-period timer is pending

      vi.advanceTimersByTime(449); // 50 + 449 = 499ms total
      expect(setLoading).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1); // hits exactly 500ms
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);
    });

    it('Cenario B — slow request (2000ms): turns loading false immediately, no extra delay', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      source$.pipe(withSmoothLoading(setLoading, MIN_DURATION)).subscribe();

      vi.advanceTimersByTime(2000);
      source$.next(1);
      source$.complete();

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0); // no grace-period timer was ever created
    });

    it('Cenario C — early unsubscribe: turns loading false immediately and cancels any internal timer', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(withSmoothLoading(setLoading, MIN_DURATION)).subscribe();

      vi.advanceTimersByTime(50);
      subscription.unsubscribe();

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(setLoading).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0); // proves no dangling setTimeout was scheduled

      // Advancing time further must not trigger any additional (leaked) call.
      vi.advanceTimersByTime(MIN_DURATION);
      expect(setLoading).toHaveBeenCalledTimes(2);
    });

    it('honors minDuration on error the same way it does on success (no premature flicker)', () => {
      const setLoading = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      source$.pipe(withSmoothLoading(setLoading, MIN_DURATION)).subscribe({
        error: () => undefined,
      });

      vi.advanceTimersByTime(50);
      source$.error(new Error('boom'));

      expect(setLoading).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(450);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('Cenario A — fast request: delays turning off until minDuration', () => {
      const set = vi.fn<(value: boolean) => void>();

      of('instant').pipe(withSmoothLoading({ set }, MIN_DURATION)).subscribe();

      expect(set).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(MIN_DURATION);
      expect(set).toHaveBeenNthCalledWith(2, false);
    });

    it('Cenario C — early unsubscribe cancels the internal timer and turns off immediately', () => {
      const set = vi.fn<(value: boolean) => void>();
      const source$ = new Subject<number>();

      const subscription = source$.pipe(withSmoothLoading({ set }, MIN_DURATION)).subscribe();
      subscription.unsubscribe();

      expect(set).toHaveBeenNthCalledWith(2, false);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
