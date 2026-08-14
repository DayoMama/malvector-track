'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Look up role to route to the right landing page (UC-1 main flow).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (!profile || !profile.is_active) {
      setError('This account is inactive. Contact your Programme Administrator.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push(profile.role === 'admin' ? '/dashboard' : '/distribution');
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>MalVector Track</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          NMEP vector intervention &amp; resistance monitoring
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
