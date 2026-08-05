# rx-state-bridge

## 1.1.0

### Minor Changes

- 3f022d6: Add an optional third parameter to `withTemporarySuccess(indicator, duration, options?)`: `options.signal` accepts an `AbortSignal` to cancel a still-pending `false` reset early (e.g. when a newer request supersedes an older one on a shared indicator). This operator's completion was intentionally left undelayed — unlike `withSmoothLoading`, blocking completion for the full `duration` would defeat its purpose as background toast/checkmark feedback — so the reset remains fire-and-forget by default; `signal` is opt-in for callers who need to cancel it explicitly. No change to existing behavior when `options` is omitted.

### Patch Changes

- 9be7e9e: Fix `withSmoothLoading`'s grace-period timer being detached from the operator's subscription lifecycle. Previously, once the source completed faster than `minDuration`, the delayed `false` write was scheduled via a standalone `timer(...).subscribe(...)` with no link back to the outer subscription — so unsubscribing during that grace window (e.g. a component unmounting, or a `switchMap` moving on to a new request) could not cancel it, and the stale write could land later on an indicator a newer request was still driving. The completion/error notification is now held for the (bounded, at most `minDuration`) grace window itself, so a real unsubscribe at any point — including mid-grace-window — cancels the pending timer and resets the indicator immediately, matching the operator's documented "nothing left running in the background to leak" guarantee. The already-correct fast/slow/early-unsubscribe-before-completion behaviors are unchanged.
