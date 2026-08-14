'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DistributionForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    intervention_type: 'ITN',
    distribution_date: '',
    quantity: '',
    households_covered: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/distribution-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error || 'Something went wrong.');
      return;
    }

    setSuccess('Distribution cycle recorded. Disposal tracking has been scheduled automatically.');
    setForm({ intervention_type: 'ITN', distribution_date: '', quantity: '', households_covered: '' });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="intervention_type">Intervention Type</label>
      <select
        id="intervention_type"
        value={form.intervention_type}
        onChange={(e) => update('intervention_type', e.target.value)}
      >
        <option value="ITN">ITN — Insecticide-Treated Net</option>
        <option value="IRS">IRS — Indoor Residual Spraying</option>
      </select>

      <label htmlFor="distribution_date">Distribution Date</label>
      <input
        id="distribution_date"
        type="date"
        required
        value={form.distribution_date}
        onChange={(e) => update('distribution_date', e.target.value)}
      />

      <label htmlFor="quantity">Quantity</label>
      <input
        id="quantity"
        type="number"
        min="1"
        required
        value={form.quantity}
        onChange={(e) => update('quantity', e.target.value)}
      />

      <label htmlFor="households_covered">Households Covered</label>
      <input
        id="households_covered"
        type="number"
        min="0"
        required
        value={form.households_covered}
        onChange={(e) => update('households_covered', e.target.value)}
      />

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Record Distribution Cycle'}
      </button>
    </form>
  );
}
