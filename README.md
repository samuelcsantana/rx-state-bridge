# rx-state-bridge

[![npm version](https://img.shields.io/npm/v/rx-state-bridge.svg)](https://www.npmjs.com/package/rx-state-bridge)
[![npm downloads](https://img.shields.io/npm/dm/rx-state-bridge.svg)](https://www.npmjs.com/package/rx-state-bridge)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/rx-state-bridge)](https://bundlephobia.com/package/rx-state-bridge)
[![Build Status](https://github.com/samuelcsantana/rx-state-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelcsantana/rx-state-bridge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

Framework-agnostic RxJS operators that bridge async streams with UI state primitives — React Hooks, Angular Signals, Vue Refs, or anything else exposing a callback or a `.set()` method. Stop hand-rolling `loading`/`error`/`success` boilerplate around every API call.

- **Zero dependencies** (RxJS is a peer dependency only)
- **Framework-agnostic** — no React/Angular/Vue imports, ever
- **Memory-safe** — every side effect starts on `subscribe` (`defer`) and is torn down on completion, error, _or_ unsubscription (`finalize`)

## Install

```bash
npm install rx-state-bridge rxjs
```

## Quick example

```ts
import { withSmoothLoading, catchToState, bindTo } from 'rx-state-bridge';

const [data, setData] = useState<User | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<unknown>(null);

useEffect(() => {
  const sub = fetchUser$(id)
    .pipe(
      withSmoothLoading(setLoading, 500), // no spinner flicker on fast responses
      catchToState(setError), // capture errors into state, complete gracefully
      bindTo(setData), // write the result into state
    )
    .subscribe();

  return () => sub.unsubscribe();
}, [id]);
```

The same pipeline works unchanged with Angular signals:

```ts
readonly loading = signal(false);
readonly error = signal<unknown>(null);
readonly data = signal<User | null>(null);

readonly user$ = this.fetchUser(this.id).pipe(
  withSmoothLoading(this.loading, 500),
  catchToState(this.error),
  bindTo(this.data),
);
```

## Examples

Live, editable demos for every operator — one card per operator, running against a fake in-memory API (no real network):

- [`examples/react`](./examples/react) — [open in StackBlitz →](https://stackblitz.com/github/samuelcsantana/rx-state-bridge/tree/main/examples/react)
- [`examples/angular`](./examples/angular) — [open in StackBlitz →](https://stackblitz.com/github/samuelcsantana/rx-state-bridge/tree/main/examples/angular)

Or run either locally:

```bash
cd examples/react   # or examples/angular
npm install
npm run dev          # examples/angular uses `npm run start`
```

## API

| Operator                                              | Purpose                                                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withLoading(indicator)`                              | Sets `indicator` to `true` on subscribe, `false` on completion/error/unsubscribe.                                                                                                                 |
| `withSmoothLoading(indicator, minDuration)`           | Like `withLoading`, but keeps the indicator `true` for at least `minDuration` ms to avoid spinner flicker.                                                                                        |
| `catchToState(errorIndicator, options?)`              | Captures errors into `errorIndicator`, then completes gracefully (default) or re-throws (`{ rethrow: true }`).                                                                                    |
| `withTemporarySuccess(indicator, duration, options?)` | Sets `indicator` to `true` on successful completion, then resets it to `false` after `duration` ms. Completion itself is never delayed — pass `{ signal }` to cancel a still-pending reset early. |
| `bindTo(state)`                                       | Writes every emitted value into `state`, forwarding it downstream unchanged.                                                                                                                      |
| `bindRequestState(indicator, options?)`               | Fuses `withLoading` + `catchToState` + `bindTo` into one write: sets `indicator` to `{ loading, error, data }` across the stream's lifecycle.                                                     |
| `combineLoading(...values)`                           | Plain helper (not an operator) that ORs several loading booleans into one. Call it inside your own render/`computed()`.                                                                           |

All operators accept a `StateIndicator<T>`:

```ts
type StateIndicator<T> = ((value: T) => void) | { set: (value: T) => void };
```

### Cancelling a pending `withTemporarySuccess` reset

`withTemporarySuccess` completes immediately — the `duration` timer is a background reset, not something that blocks whatever runs after `.subscribe()`. If you reuse the same indicator across overlapping or sequential requests (e.g. re-running an effect when `id` changes), a superseded request's reset could otherwise land after a newer one has already moved on. Pass an `AbortSignal` to cancel it explicitly:

```ts
const [saved, setSaved] = useState(false);

useEffect(() => {
  const controller = new AbortController();
  const sub = save$(id)
    .pipe(withTemporarySuccess(setSaved, 2000, { signal: controller.signal }))
    .subscribe();

  return () => {
    controller.abort();
    sub.unsubscribe();
  };
}, [id]);
```

`withSmoothLoading`, by contrast, needs no such option: unsubscribing at any point — including mid-way through its own `minDuration` grace period — always cancels the pending timer and resets the indicator immediately.

### Collapsing `loading`/`error`/`data` into one state with `bindRequestState`

The [Quick example](#quick-example) above wires three separate state setters. `bindRequestState` collapses them into one:

```ts
// Before — three setters, three operators
const [data, setData] = useState<User | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<unknown>(null);

useEffect(() => {
  const sub = fetchUser$(id)
    .pipe(withLoading(setLoading), catchToState(setError), bindTo(setData))
    .subscribe();
  return () => sub.unsubscribe();
}, [id]);

// After — one setter, one operator
const [user, setUser] = useState<RequestState<User>>({ loading: false, error: null, data: null });

useEffect(() => {
  const sub = fetchUser$(id).pipe(bindRequestState(setUser)).subscribe();
  return () => sub.unsubscribe();
}, [id]);
```

`data` is only ever overwritten by a new emission — an error never clears a previously-received value, so the last good result stays visible alongside the error. Reach for the individual operators instead when you need `withSmoothLoading`'s flicker-free timing or `withTemporarySuccess`'s toast-style feedback; `bindRequestState` covers the plain loading/error/data case.

### Combining multiple loading flags with `combineLoading`

For a dashboard driving several independent, unrelated fetches that should collapse into one spinner:

```ts
const [usersLoading, setUsersLoading] = useState(false);
const [ordersLoading, setOrdersLoading] = useState(false);

const isAnythingLoading = combineLoading(usersLoading, ordersLoading);
```

It's a plain function, not an RxJS operator — call it inside your own render/`computed()` so it re-evaluates whenever any underlying value changes.

## Design notes

A couple of decisions in this library aren't obvious from the API surface alone. Written down here so they don't turn into repeated GitHub issues.

**Why does `withSmoothLoading` delay `complete`/`error`, but `withTemporarySuccess` doesn't?**
Both operators have a timer between "the source finished" and "the indicator settles." The difference is what that timer is _for_. `withSmoothLoading`'s grace period is a correction to the indicator's own timing — the whole point is that the operator shouldn't tell you it's done until the minimum duration has actually elapsed, so holding the stream's own completion for that (bounded, capped at `minDuration`) window is the operator being honest about when it actually finished. `withTemporarySuccess`'s reset window is different in kind: it's decorative feedback (a toast, a checkmark) layered _after_ the real work is already done. Delaying `complete` there — for the full `duration`, often 2s+ — would block whatever the caller does next (`subscribe(() => navigate())`, a chained operator) for a UI detail that has nothing to do with it. So `withSmoothLoading` fixes correctness by holding completion; `withTemporarySuccess` keeps completion immediate and instead accepts an optional `signal: AbortSignal` so a caller who actually needs to cancel the pending reset (e.g. a superseded request sharing one indicator) can opt in, without paying for it by default.

This is also why `withSmoothLoading` needed no new API to become fully safe (unsubscribing during the grace window has always been the fix to reach for), while `withTemporarySuccess`'s fix is additive and opt-in — the two bugs looked identical on the surface (a detached `timer(...).subscribe(...)` with no link to the outer subscription) but the correct fix for each followed from what the timer represents, not just from "make it cancellable."

**Why does an error never clear previously-received `data`?**
`catchToState`, `bindRequestState`, and the `RequestState<T>` shape all treat a caught error as _additional_ information, not a replacement for what you already had. A failed refresh shouldn't blank out the last good screen — showing stale-but-real data next to a fresh error is almost always closer to what the UI should do than clearing to empty. If you want the old-fashioned "wipe on error" behavior, that's one line at the call site (`data: null` in your own error handler) rather than something the library should force on everyone.

## Development

```bash
npm run dev     # watch build
npm run build   # ESM + CJS + .d.ts via tsup
npm run test    # vitest
npm run lint    # eslint + prettier --check
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branching model, commit conventions, and how to add a changeset.

## License

[MIT](./LICENSE)
