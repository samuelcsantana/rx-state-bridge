import { useState } from 'react';
import { bindRequestState, type RequestState } from 'rx-state-bridge';
import { fetchUser$, type User } from '../fakeApi';

export function BindRequestStateDemo() {
  const [user, setUser] = useState<RequestState<User>>({ loading: false, error: null, data: null });

  const run = () => {
    fetchUser$(6, { latency: 600, failRate: 0.3 }).pipe(bindRequestState(setUser)).subscribe();
  };

  return (
    <section className="card">
      <h2>bindRequestState</h2>
      <p>One state instead of three — {'{ loading, error, data }'} in a single write.</p>
      <button onClick={run} disabled={user.loading}>
        {user.loading ? 'Loading…' : 'Fetch (may fail)'}
      </button>
      {user.data && <p className="result">{user.data.name}</p>}
      {user.error != null && <p className="error">{(user.error as Error).message}</p>}
    </section>
  );
}
