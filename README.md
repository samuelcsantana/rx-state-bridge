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

## API

| Operator                                              | Purpose                                                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withLoading(indicator)`                              | Sets `indicator` to `true` on subscribe, `false` on completion/error/unsubscribe.                                                                                                                 |
| `withSmoothLoading(indicator, minDuration)`           | Like `withLoading`, but keeps the indicator `true` for at least `minDuration` ms to avoid spinner flicker.                                                                                        |
| `catchToState(errorIndicator, options?)`              | Captures errors into `errorIndicator`, then completes gracefully (default) or re-throws (`{ rethrow: true }`).                                                                                    |
| `withTemporarySuccess(indicator, duration, options?)` | Sets `indicator` to `true` on successful completion, then resets it to `false` after `duration` ms. Completion itself is never delayed — pass `{ signal }` to cancel a still-pending reset early. |
| `bindTo(state)`                                       | Writes every emitted value into `state`, forwarding it downstream unchanged.                                                                                                                      |

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
