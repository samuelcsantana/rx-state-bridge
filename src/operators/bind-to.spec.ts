import { Subject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { bindTo } from './bind-to';

describe('bindTo', () => {
  describe('with a callback indicator (React-style setState)', () => {
    it('updates the state with the exact value emitted by the Observable', () => {
      const setData = vi.fn<(value: number) => void>();
      const values: number[] = [];

      of(1, 2, 3)
        .pipe(bindTo(setData))
        .subscribe((value) => values.push(value));

      expect(setData).toHaveBeenNthCalledWith(1, 1);
      expect(setData).toHaveBeenNthCalledWith(2, 2);
      expect(setData).toHaveBeenNthCalledWith(3, 3);
      expect(setData).toHaveBeenCalledTimes(3);
      expect(values).toEqual([1, 2, 3]); // the value is still forwarded downstream
    });

    it('preserves object identity — no cloning or transformation of the emitted value', () => {
      const setUser = vi.fn<(value: { id: number }) => void>();
      const user = { id: 42 };

      of(user).pipe(bindTo(setUser)).subscribe();

      expect(setUser).toHaveBeenCalledWith(user);
      expect(setUser.mock.calls[0]?.[0]).toBe(user);
    });

    it('does not call the setter when the source completes without emitting', () => {
      const setData = vi.fn<(value: number) => void>();
      const source$ = new Subject<number>();

      source$.pipe(bindTo(setData)).subscribe();
      source$.complete();

      expect(setData).not.toHaveBeenCalled();
    });
  });

  describe('with a Signal-like indicator (Angular-style .set())', () => {
    it('updates the signal with the exact emitted value', () => {
      const set = vi.fn<(value: string) => void>();

      of('hello').pipe(bindTo({ set })).subscribe();

      expect(set).toHaveBeenCalledWith('hello');
      expect(set).toHaveBeenCalledTimes(1);
    });

    it('calls .set() once per emission, in order', () => {
      const set = vi.fn<(value: number) => void>();

      of(10, 20, 30).pipe(bindTo({ set })).subscribe();

      expect(set).toHaveBeenNthCalledWith(1, 10);
      expect(set).toHaveBeenNthCalledWith(2, 20);
      expect(set).toHaveBeenNthCalledWith(3, 30);
    });
  });
});
