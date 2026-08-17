# rx-state-bridge - Agent Instructions

## ðŸŽ¯ Project Overview

You are assisting with `rx-state-bridge`, an open-source TypeScript library that provides purely functional RxJS operators to bridge asynchronous flows with modern UI state primitives (Angular Signals, React Hooks, Vue Refs).
The core philosophy is **zero dependencies (except RxJS)**, **framework-agnosticism**, and **perfect memory safety**.

Current surface: `withLoading`, `withSmoothLoading`, `catchToState`, `withTemporarySuccess`, `bindTo`, `bindRequestState` (operators) and `combineLoading` (a plain helper, not an operator). Keep this list narrow â€” this library's edge over TanStack Query/SWR-style solutions is being a small, focused kit, not a competing full-featured data-fetching library. Resist adding retry/backoff, caching, staleness, or pagination; that's out of scope by design.

`examples/react` and `examples/angular` are live, runnable demos (one card per operator, against a fake in-memory API). They are **separate, standalone npm projects** with their own `package.json`/tsconfig â€” not part of the published package, and not covered by the root `tsconfig.json`.

## ðŸ› ï¸ Tech Stack & Tooling

- **Language:** TypeScript (Strict Mode)
- **Core Library:** RxJS (Peer Dependency)
- **Testing:** Vitest
- **Bundler:** tsup / Rollup (ESM & CommonJS output)
- `examples/*` are excluded from the root `.eslintrc.cjs` (`ignorePatterns: [..., 'examples']`) because ESLint's typed-linting (`parserOptions.project`) can't parse files outside the root tsconfig's `include`. Don't remove that ignore entry to "fix" a lint gap â€” each example has its own lint/build story if it ever needs one. When editing files under `examples/*`, `cd` into that example and run `npm install`/`npm run dev`/`npm run build` there; the root `npm run *` scripts don't touch them.

## ðŸ“ Coding Standards

When writing or modifying code in this repository, strictly adhere to the following rules:

### 1. RxJS Best Practices

- **No Side Effects in `tap` for Lifecycles:** Do not use `tap` to start loading states. Always use `defer` to ensure the side-effect happens exactly on `subscribe`.
- **Bulletproof Teardowns:** Always use `finalize` to clean up states. Ensure the UI never gets stuck in a loading state if the consumer unsubscribes early.
- **Never detach async cleanup from the subscription lifecycle.** `withSmoothLoading` and `withTemporarySuccess` both originally scheduled their delayed "flip indicator back" step as `timer(...).subscribe(...)` from inside `finalize`/`tap({ complete })` â€” a child subscription with no link back to the outer one. Once the source completed, RxJS auto-closed the outer subscription *before* that timer fired, so a later `unsubscribe()` (component unmount, a `switchMap` moving to a new request) could never cancel it; it fired anyway, writing a stale value into a state setter that may no longer be valid. If a fix needs a timer/async gap between "the source settled" and "the indicator updates," either (a) hold the actual completion/error notification for that gap so the real subscription lifecycle governs it (`withSmoothLoading`'s fix â€” appropriate when the gap is small/bounded and delaying completion doesn't change the operator's contract), or (b) if delaying completion would break the operator's purpose (`withTemporarySuccess` â€” completion must stay immediate), give the caller an explicit, opt-in cancellation handle (`options.signal: AbortSignal`) rather than pretending `finalize`/`unsubscribe` alone covers it. See the README's "Design notes" section for the full reasoning.
- **Purity:** Operators must be pure functions returning a `MonoTypeOperatorFunction` or `OperatorFunction`. Do not mutate external state outside the provided indicator callbacks.

### 2. TypeScript & Typings

- No `any`. Use Generics (`<T>`) to ensure type safety is preserved through the RxJS pipe.
- The `StateIndicator` type must elegantly support both function callbacks (e.g., React `setState`) and objects with a `.set()` method (e.g., Angular Signals).
  - Example signature: `type StateIndicator<T> = ((value: T) => void) | { set: (value: T) => void };`
- **In `applyIndicator` (and anywhere else that needs to tell the two `StateIndicator` shapes apart), check for a `.set` method *first*, never `typeof indicator === 'function'` first.** Angular's `WritableSignal` is itself callable (`mySignal()` reads the current value), so it satisfies `typeof === 'function'` too. Checking that first silently misroutes every signal into the "plain callback" branch â€” `indicator(value)` on a real signal just returns the current value, ignoring the argument, with no error and no warning. This broke every operator for every Angular consumer across three published versions (1.0.0â€“1.2.0) before being caught. The correct check: `typeof indicator.set === 'function' ? indicator.set(value) : indicator(value)`.
- Export all necessary TypeScript interfaces in the entry point.

### 3. Framework Agnosticism

- Do not import anything from React, Angular, Vue, or any other UI framework â€” including in `devDependencies` of the root package. (The `examples/*` sub-projects are the one place framework packages belong, and they're intentionally separate npm projects for exactly this reason.)
- If providing code examples in JSDoc, include both a React example and an Angular example.

### 4. Testing (Vitest)

- Every operator must have comprehensive unit tests.
- Tests must cover:
  1. Successful completion.
  2. Error scenarios (especially for `catchToState`).
  3. **Early unsubscription:** Prove that `finalize` triggers and the state is cleaned up if the observable is unsubscribed before completion.
- Use fake timers (`vi.useFakeTimers()`) to test operators like `withSmoothLoading` and `withTemporarySuccess`.
- **Compiling and unit-testing are not the same as running.** The Angular-signal bug above passed `tsc`, `ng build`, and every existing unit test (which all used plain mock functions as indicators, never a real callable signal) â€” it was only caught by actually running `examples/angular` in a browser and polling the rendered DOM, because the component's own `console.log`s and the mock-based unit tests all looked completely normal. When a change touches `applyIndicator`, `StateIndicator` handling, or anything else that behaves differently across the two indicator shapes, add a regression test that reproduces the *real* shape by hand (a callable function with a `.set` property attached, mimicking `WritableSignal` â€” see `applyIndicator.spec.ts`) rather than only a plain mock, and prefer actually driving the relevant `examples/*` app over trusting a green test suite alone.

## ðŸ’» Common Commands

- `npm run dev`: Run in watch mode.
- `npm run build`: Build for production (ESM/CJS).
- `npm run test`: Run Vitest test suite.
- `npm run lint`: Check code formatting and linting rules.
- On Windows, a clean `git checkout` converts line endings to CRLF, so `npm run lint`'s `prettier --check` can flag many pre-existing, already-CI-clean files as a false positive. Don't blanket-assume that â€” run `git diff -b -- <file>` (ignores whitespace) per flagged file before deciding it's noise vs. a genuine violation; CI runs on Linux and will still fail on a real one regardless of what your local check shows.

## ðŸŒ³ Branching Strategy (overrides the global Gitflow default)

The global `AGENTS.md` default is Gitflow (`feature/`, `bugfix/`, `hotfix/`, `release/` branches). **This repository intentionally deviates from that and uses GitHub Flow instead** â€” the standard model for single-package npm libraries (React, Vue, RxJS itself all work this way), where "released" simply means "published to npm" and there is no need for parallel `release`/`hotfix` branches or scheduled environments.

- `main` is the only long-lived branch. It always reflects what's published (or about to be published) on npm.
- Every change â€” feature, fix, docs, whatever â€” happens on a short-lived branch cut from `main`, named after its purpose (e.g. `feat/with-throttled-loading`, `fix/smooth-loading-timer-leak`, `docs/readme-badges`). No `feature/`, `bugfix/`, `hotfix/`, or `release/` prefixes.
- Open a PR into `main`. Once approved and merged, delete the branch.
- Never commit directly to `main`; always go through a PR, even for small fixes.

## ðŸ“¦ Release Automation (Changesets)

Versioning and publishing are driven by [Changesets](https://github.com/changesets/changesets), not by parsing commit messages:

- Every PR that changes published behavior must include a changeset: run `npx changeset`, pick the bump type (patch/minor/major), and write a one-line summary of the change. Docs-only or test-only PRs do not need one.
- On merge to `main`, the `Release` GitHub Actions workflow (`.github/workflows/release.yml`) opens/updates a "chore: version packages" PR that bumps `package.json` and writes `CHANGELOG.md` from the accumulated changesets. Merging _that_ PR triggers the actual `npm publish`.
- The Conventional Commits format described above is still expected for commit hygiene and PR titles (readability, `git log` scanning) â€” it just isn't what drives the version number here; the changeset files are the source of truth for that.
- **Repo setting dependency:** the Release workflow needs "Allow GitHub Actions to create and approve pull requests" enabled (Settings â†’ Actions â†’ General â†’ Workflow permissions) â€” without it, the changesets bot fails at the "Create release PR" step with `GitHub Actions is not permitted to create or approve pull requests`. This should already be enabled; if it regresses, that's the fix (`gh api -X PUT repos/OWNER/REPO/actions/permissions/workflow -f default_workflow_permissions=write -F can_approve_pull_request_reviews=true`).
- **Each CI run on the bot-created `changeset-release/main` branch still needs a one-time manual approval** (`action_required` status, 0 jobs run) before its checks execute â€” this is a separate, per-run GitHub safeguard for workflow runs triggered by a bot-authored branch, not something the repo setting above fixes permanently. Approve via the PR's checks UI, or `gh api -X POST repos/OWNER/REPO/actions/runs/RUN_ID/approve`.

## ðŸ“ Pull Request & Git Guidelines

- Ensure all types are correct and tests pass before suggesting a commit.
- Keep commits focused on a single operator or fix.
- Write clear, descriptive commit messages.
- Include a changeset (`npx changeset`) in the same PR whenever the change affects the published package's behavior.
- **Do not add a `Co-Authored-By` trailer to commits** unless explicitly asked to for that specific commit.
