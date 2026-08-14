import { NextResponse } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import { computeDueDate } from '@/lib/disposal';

// Implements the sequence in System_Design.docx Figure 4:
// 1-2: form submit -> POST here
// 3-4: session/role verified via getCurrentProfile (backed by Supabase Auth)
// 5:   server-side validation (NFR-1) — duplicates client-side checks
// 6-7: INSERT distribution_cycles, RLS-scoped to the officer's district
// 8:   compute due_date, INSERT disposal_items
// 9:   return the created record
export async function POST(request) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (profile.role !== 'officer') {
    return NextResponse.json({ error: 'Only District Officers can log distribution cycles.' }, { status: 403 });
  }
  if (!profile.district_id) {
    return NextResponse.json({ error: 'Your account has no assigned district.' }, { status: 400 });
  }

  const body = await request.json();
  const { intervention_type, distribution_date, quantity, households_covered } = body;

  // Step 5: server-side validation — never trust the client alone (NFR-1).
  if (!['ITN', 'IRS'].includes(intervention_type)) {
    return NextResponse.json({ error: 'Invalid intervention type.' }, { status: 400 });
  }
  if (!distribution_date || isNaN(Date.parse(distribution_date))) {
    return NextResponse.json({ error: 'Invalid distribution date.' }, { status: 400 });
  }
  const qty = Number(quantity);
  const households = Number(households_covered);
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ error: 'Quantity must be a positive number.' }, { status: 400 });
  }
  if (!Number.isFinite(households) || households < 0) {
    return NextResponse.json({ error: 'Households covered must be zero or more.' }, { status: 400 });
  }
if (households > qty) {
    return NextResponse.json(
      { error: 'Households covered cannot exceed the quantity distributed.' },
      { status: 400 }
    );
  }

  // Step 6: INSERT — RLS policy "distribution_insert" additionally enforces
  // that district_id must match the officer's own profile.district_id.
  const { data: cycle, error: insertError } = await supabase
    .from('distribution_cycles')
    .insert({
      district_id: profile.district_id,
      intervention_type,
      distribution_date,
      quantity: qty,
      households_covered: households,
      created_by: profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // Step 8: compute due date and create the linked disposal tracking row.
  const dueDate = computeDueDate(intervention_type, distribution_date);
  const { error: disposalError } = await supabase.from('disposal_items').insert({
    distribution_cycle_id: cycle.id,
    due_date: dueDate,
    status: 'pending',
  });

  if (disposalError) {
    // The cycle was created but disposal tracking failed — surfaced to the
    // caller rather than silently dropped, per NFR-1 error handling.
    return NextResponse.json(
      { error: `Cycle recorded, but disposal tracking failed: ${disposalError.message}` },
      { status: 207 }
    );
  }

  // Step 9: return the created record.
  return NextResponse.json({ cycle, due_date: dueDate }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('distribution_cycles')
    .select('id, intervention_type, distribution_date, quantity, households_covered, districts(name)')
    .order('distribution_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cycles: data });
}
