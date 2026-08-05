---
'rx-state-bridge': minor
---

Add an optional third parameter to `withTemporarySuccess(indicator, duration, options?)`: `options.signal` accepts an `AbortSignal` to cancel a still-pending `false` reset early (e.g. when a newer request supersedes an older one on a shared indicator). This operator's completion was intentionally left undelayed — unlike `withSmoothLoading`, blocking completion for the full `duration` would defeat its purpose as background toast/checkmark feedback — so the reset remains fire-and-forget by default; `signal` is opt-in for callers who need to cancel it explicitly. No change to existing behavior when `options` is omitted.
