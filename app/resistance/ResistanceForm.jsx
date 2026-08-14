'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResistanceForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    vector_species: 'Anopheles gambiae',
    insecticide_class: 'Pyrethroid',
    result: 'susceptible',
    test_date: '',
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

    const res = await fetch('/api/resistance-tests', {
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

    setSuccess('Resistance result recorded.');
    setForm((f) => ({ ...f, test_date: '' }));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="vector_species">Vector Species</label>
      <input
        id="vector_species"
        required
        value={form.vector_species}
        onChange={(e) => update('vector_species', e.target.value)}
        placeholder="e.g. Anopheles gambiae"
      />

      <label htmlFor="insecticide_class">Insecticide Class Tested</label>
      <select
        id="insecticide_class"
        value={form.insecticide_class}
        onChange={(e) => update('insecticide_class', e.target.value)}
      >
        <option>Pyrethroid</option>
        <option>Organophosphate</option>
        <option>Carbamate</option>
        <option>PBO-synergist</option>
      </select>

      <label htmlFor="result">Result</label>
      <select id="result" value={form.result} onChange={(e) => update('result', e.target.value)}>
        <option value="susceptible">Susceptible</option>
        <option value="possible_resistance">Possible resistance</option>
        <option value="resistant">Resistant</option>
      </select>

      <label htmlFor="test_date">Test Date</label>
      <input
        id="test_date"
        type="date"
        required
        value={form.test_date}
        onChange={(e) => update('test_date', e.target.value)}
      />

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Record Result'}
      </button>
    </form>
  );
}
