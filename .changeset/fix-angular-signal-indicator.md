---
'rx-state-bridge': patch
---

Fix `applyIndicator` silently failing to write to Angular `WritableSignal` indicators. Angular's `WritableSignal` is itself callable (`mySignal()` reads the current value), so the internal `typeof indicator === 'function'` check — meant to distinguish a plain callback (`(value) => void`) from a `{ set }` object — matched signals too and called them as a getter with an ignored argument instead of `.set()`. This made **every operator** (`withLoading`, `withSmoothLoading`, `catchToState`, `withTemporarySuccess`, `bindTo`, `bindRequestState`) a silent no-op when passed a signal directly, exactly as shown in this library's own Angular JSDoc examples — no error, the indicator simply never updated. `applyIndicator` now checks for a `.set` method first, which correctly routes both callable signals and plain `{ set }` objects to `.set()`, falling back to direct invocation only for indicators with no `.set` property.
