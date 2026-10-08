# Security policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub's private vulnerability reporting](https://github.com/samuelcsantana/rx-state-bridge/security/advisories/new).
Do not open a public issue.

Include what you found, how to reproduce it and the impact you expect. You will get an
acknowledgement within a few days, and the fix will be credited to you if you wish.

## Scope

The package has no runtime dependencies and makes no network requests of its own, so the
interesting surface is small. Of particular interest:

- an operator that keeps writing to a state indicator after its subscription has been torn down,
  so a stale value can land in a component that is gone or belongs to a different request;
- an error swallowed by `catchToState` or `bindRequestState` without ever reaching the error
  indicator;
- a tampered package: every release after 1.2.2 is published by GitHub Actions with npm
  provenance, so a newer version without a provenance attestation is suspicious.
