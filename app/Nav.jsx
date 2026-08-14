import Link from 'next/link';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import SignOutButton from './SignOutButton';

export default async function Nav() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return null;

  return (
    <nav className="navbar">
      <div>
        <Link href="/">MalVector Track</Link>
        {profile.role === 'officer' && (
          <>
            <Link href="/distribution">Distribution</Link>
            <Link href="/disposal">Disposal</Link>
            <Link href="/resistance">Resistance</Link>
          </>
        )}
        {profile.role === 'admin' && <Link href="/dashboard">Dashboard</Link>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13 }}>
          {profile.email} · {profile.role}
        </span>
        <SignOutButton />
      </div>
    </nav>
  );
}
