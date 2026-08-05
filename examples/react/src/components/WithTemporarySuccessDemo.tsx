import { useState } from 'react';
import { withLoading, withTemporarySuccess } from 'rx-state-bridge';
import { fetchUser$ } from '../fakeApi';

export function WithTemporarySuccessDemo() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const run = () => {
    fetchUser$(5, { latency: 500 })
      .pipe(withLoading(setLoading), withTemporarySuccess(setSaved, 2000))
      .subscribe();
  };

  return (
    <section className="card">
      <h2>withTemporarySuccess</h2>
      <p>Flips true on success, resets to false after 2s — no manual setTimeout.</p>
      <button onClick={run} disabled={loading}>
        {loading ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="badge">✓ Saved</span>}
    </section>
  );
}
