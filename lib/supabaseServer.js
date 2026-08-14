import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client. Used in Server Components, Route Handlers,
// and middleware.js so that session cookies (and therefore RLS auth.uid())
// are respected on every request — this is what makes NFR-2 (RLS, not just
// UI hiding) actually enforceable server-side.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // because middleware.js refreshes the session on every request.
          }
        },
      },
    }
  );
}

// Fetches the current user's profile (role + district), or null if not logged in.
export async function getCurrentProfile(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, district_id, is_active')
    .eq('id', user.id)
    .single();

  return profile;
}
