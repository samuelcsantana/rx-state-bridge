import { useState } from 'react';
import { withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fakeApi';

export function WithLoadingDemo() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const run = () => {
    fetchUser$(1, { latency: 800 })
      .pipe(withLoading(setLoading))
      .subscribe((user) => setName(user.name));
  };

  return (
    <section className="card">
      <h2>withLoading</h2>
      <p>Boolean indicator, true on subscribe, false on completion.</p>
      <button onClick={run} disabled={loading}>
        {loading ? 'Loading…' : 'Fetch user'}
      </button>
      {name && <p className="result">{name}</p>}
    </section>
  );
}
