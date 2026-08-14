'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      style={{ background: 'transparent', border: '1px solid white', padding: '4px 10px', marginTop: 0 }}
    >
      Sign out
    </button>
  );
}
