---
'rx-state-bridge': minor
---

Add `bindRequestState(indicator, options?)`: fuses `withLoading` + `catchToState` + `bindTo` into a single operator that writes one composed `{ loading, error, data }` object into one indicator, instead of wiring three separate state setters for the common "fetch a resource" pattern. `data` is only ever overwritten by a new emission — an error never clears a previously-received value.

Add `combineLoading(...values)`: a plain synchronous helper (not an RxJS operator) that ORs several independent loading booleans into one, for dashboards driving multiple unrelated fetches that should collapse into a single spinner. Call it inside your own render/`computed()`.

Both are purely additive, backward-compatible exports — no changes to any existing operator.
