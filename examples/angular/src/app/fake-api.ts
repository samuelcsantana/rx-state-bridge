import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
}

const NAMES = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Margaret Hamilton', 'Katherine Johnson'];

/** A fake network call — no real requests, just a delay and an optional random failure. */
export function fetchUser$(
  id: number,
  { latency = 800, failRate = 0 }: { latency?: number; failRate?: number } = {},
) {
  if (Math.random() < failRate) {
    return throwError(() => new Error(`Failed to load user #${id}`)).pipe(delay(latency));
  }

  const user: User = { id, name: NAMES[id % NAMES.length] };
  return of(user).pipe(delay(latency));
}
