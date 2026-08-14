import { NextResponse } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';

const VALID_STATUSES = ['pending', 'disposed', 'replaced'];

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const { status, action_date } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  if (!action_date || isNaN(Date.parse(action_date))) {
    return NextResponse.json({ error: 'Invalid action date.' }, { status: 400 });
  }

  // RLS policy "disposal_update" independently enforces that the caller's
  // district matches the disposal item's parent distribution cycle.
  const { data, error } = await supabase
    .from('disposal_items')
    .update({ status, action_date, updated_by: profile.id })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Item not found or not permitted.' }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}
