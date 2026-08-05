import { WithLoadingDemo } from './components/WithLoadingDemo';
import { WithSmoothLoadingDemo } from './components/WithSmoothLoadingDemo';
import { CatchToStateDemo } from './components/CatchToStateDemo';
import { WithTemporarySuccessDemo } from './components/WithTemporarySuccessDemo';
import { BindRequestStateDemo } from './components/BindRequestStateDemo';
import { CombineLoadingDemo } from './components/CombineLoadingDemo';

export function App() {
  return (
    <main>
      <header>
        <h1>rx-state-bridge</h1>
        <p>
          Live examples for every operator, running against a fake (no real network) API.{' '}
          <a
            href="https://github.com/samuelcsantana/rx-state-bridge"
            target="_blank"
            rel="noreferrer"
          >
            View source →
          </a>
        </p>
      </header>
      <div className="grid">
        <WithLoadingDemo />
        <WithSmoothLoadingDemo />
        <CatchToStateDemo />
        <WithTemporarySuccessDemo />
        <BindRequestStateDemo />
        <CombineLoadingDemo />
      </div>
    </main>
  );
}
