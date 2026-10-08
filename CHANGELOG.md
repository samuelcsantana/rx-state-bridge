# rx-state-bridge

## 1.2.3

### Patch Changes

- 0b6ad7c: Refresh the README shown on npm: light/dark cover, live demo link and CI, coverage and CodeQL badges. No code changes.

## 1.2.2

### Patch Changes

- 75ef98c: Publish a patch release to refresh the README shown on npmjs.com (centered header, real screenshot, cleaned-up badges) — the previous README changes were docs-only commits with no accompanying changeset, so npm's package page still showed the older version.

## 1.2.1

### Patch Changes

- eaa58be: Fix `applyIndicator` silently failing to write to Angular `WritableSignal` indicators. Angular's `WritableSignal` is itself callable (`mySignal()` reads the current value), so the internal `typeof indicator === 'function'` check — meant to distinguish a plain callback (`(value) => void`) from a `{ set }` object — matched signals too and called them as a getter with an ignored argument instead of `.set()`. This made **every operator** (`withLoading`, `withSmoothLoading`, `catchToState`, `withTemporarySuccess`, `bindTo`, `bindRequestState`) a silent no-op when passed a signal directly, exactly as shown in this library's own Angular JSDoc examples — no error, the indicator simply never updated. `applyIndicator` now checks for a `.set` method first, which correctly routes both callable signals and plain `{ set }` objects to `.set()`, falling back to direct invocation only for indicators with no `.set` property.

## 1.2.0

### Minor Changes

- e4d0ab6: Add `bindRequestState(indicator, options?)`: fuses `withLoading` + `catchToState` + `bindTo` into a single operator that writes one composed `{ loading, error, data }` object into one indicator, instead of wiring three separate state setters for the common "fetch a resource" pattern. `data` is only ever overwritten by a new emission — an error never clears a previously-received value.

  Add `combineLoading(...values)`: a plain synchronous helper (not an RxJS operator) that ORs several independent loading booleans into one, for dashboards driving multiple unrelated fetches that should collapse into a single spinner. Call it inside your own render/`computed()`.

  Both are purely additive, backward-compatible exports — no changes to any existing operator.

## 1.1.0

### Minor Changes

- 3f022d6: Add an optional third parameter to `withTemporarySuccess(indicator, duration, options?)`: `options.signal` accepts an `AbortSignal` to cancel a still-pending `false` reset early (e.g. when a newer request supersedes an older one on a shared indicator). This operator's completion was intentionally left undelayed — unlike `withSmoothLoading`, blocking completion for the full `duration` would defeat its purpose as background toast/checkmark feedback — so the reset remains fire-and-forget by default; `signal` is opt-in for callers who need to cancel it explicitly. No change to existing behavior when `options` is omitted.

### Patch Changes

- 9be7e9e: Fix `withSmoothLoading`'s grace-period timer being detached from the operator's subscription lifecycle. Previously, once the source completed faster than `minDuration`, the delayed `false` write was scheduled via a standalone `timer(...).subscribe(...)` with no link back to the outer subscription — so unsubscribing during that grace window (e.g. a component unmounting, or a `switchMap` moving on to a new request) could not cancel it, and the stale write could land later on an indicator a newer request was still driving. The completion/error notification is now held for the (bounded, at most `minDuration`) grace window itself, so a real unsubscribe at any point — including mid-grace-window — cancels the pending timer and resets the indicator immediately, matching the operator's documented "nothing left running in the background to leak" guarantee. The already-correct fast/slow/early-unsubscribe-before-completion behaviors are unchanged.
