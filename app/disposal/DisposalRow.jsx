'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisposalRow({ id, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function markAs(newStatus) {
    setLoading(true);
    setError('');

    const res = await fetch(`/api/disposal-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, action_date: new Date().toISOString().slice(0, 10) }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to update.');
      return;
    }

    router.refresh();
  }

  if (status !== 'pending') {
    return <span style={{ color: '#6b7280', fontSize: 13 }}>Done</span>;
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <button
        style={{ marginTop: 0, padding: '4px 10px', fontSize: 12 }}
        disabled={loading}
        onClick={() => markAs('disposed')}
      >
        Mark disposed
      </button>
      <button
        style={{ marginTop: 0, padding: '4px 10px', fontSize: 12 }}
        disabled={loading}
        onClick={() => markAs('replaced')}
      >
        Mark replaced
      </button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
