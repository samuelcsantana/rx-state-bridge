import { useState } from 'react';
import { combineLoading, withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fakeApi';

export function CombineLoadingDemo() {
  const [usersLoading, setUsersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const isAnythingLoading = combineLoading(usersLoading, ordersLoading);

  const fetchUsers = () => {
    fetchUser$(7, { latency: 700 }).pipe(withLoading(setUsersLoading)).subscribe();
  };

  const fetchOrders = () => {
    fetchUser$(8, { latency: 1400 }).pipe(withLoading(setOrdersLoading)).subscribe();
  };

  return (
    <section className="card">
      <h2>combineLoading</h2>
      <p>Two unrelated fetches, one global banner — not an operator, just a plain function.</p>
      <div className="row">
        <button onClick={fetchUsers} disabled={usersLoading}>
          {usersLoading ? 'Loading users…' : 'Fetch users'}
        </button>
        <button onClick={fetchOrders} disabled={ordersLoading}>
          {ordersLoading ? 'Loading orders…' : 'Fetch orders'}
        </button>
      </div>
      {isAnythingLoading && <p className="banner">Something is loading…</p>}
    </section>
  );
}
