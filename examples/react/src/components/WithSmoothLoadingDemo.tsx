import { useState } from 'react';
import { withSmoothLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fakeApi';

export function WithSmoothLoadingDemo() {
  const [fastLoading, setFastLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);

  const runFast = () => {
    fetchUser$(2, { latency: 120 }).pipe(withSmoothLoading(setFastLoading, 500)).subscribe();
  };

  const runSlow = () => {
    fetchUser$(3, { latency: 1200 }).pipe(withSmoothLoading(setSlowLoading, 500)).subscribe();
  };

  return (
    <section className="card">
      <h2>withSmoothLoading</h2>
      <p>minDuration = 500ms. The fast one still shows the spinner for a beat — no flicker.</p>
      <div className="row">
        <button onClick={runFast} disabled={fastLoading}>
          {fastLoading ? 'Loading…' : 'Fast fetch (120ms)'}
        </button>
        <button onClick={runSlow} disabled={slowLoading}>
          {slowLoading ? 'Loading…' : 'Slow fetch (1200ms)'}
        </button>
      </div>
    </section>
  );
}
