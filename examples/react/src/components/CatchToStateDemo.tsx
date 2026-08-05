import { useState } from 'react';
import { catchToState, withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fakeApi';

export function CatchToStateDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [name, setName] = useState<string | null>(null);

  const run = () => {
    setError(null);
    fetchUser$(4, { latency: 500, failRate: 0.5 })
      .pipe(withLoading(setLoading), catchToState(setError))
      .subscribe((user) => setName(user.name));
  };

  return (
    <section className="card">
      <h2>catchToState</h2>
      <p>~50% fail rate on purpose — click a few times to see both paths.</p>
      <button onClick={run} disabled={loading}>
        {loading ? 'Loading…' : 'Fetch (may fail)'}
      </button>
      {name && <p className="result">{name}</p>}
      {error != null && <p className="error">{(error as Error).message}</p>}
    </section>
  );
}
