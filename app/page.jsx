import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';

export default async function Home() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) redirect('/login');
  if (profile.role === 'admin') redirect('/dashboard');
  redirect('/distribution');
}
