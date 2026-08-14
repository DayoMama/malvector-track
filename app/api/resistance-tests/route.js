import { NextResponse } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';

const VALID_RESULTS = ['resistant', 'susceptible', 'possible_resistance'];

export async function POST(request) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (profile.role !== 'officer') {
    return NextResponse.json({ error: 'Only District Officers can record resistance results.' }, { status: 403 });
  }
  if (!profile.district_id) {
    return NextResponse.json({ error: 'Your account has no assigned district.' }, { status: 400 });
  }

  const body = await request.json();
  const { vector_species, insecticide_class, result, test_date } = body;

  if (!vector_species || vector_species.trim().length === 0) {
    return NextResponse.json({ error: 'Vector species is required.' }, { status: 400 });
  }
  if (!insecticide_class || insecticide_class.trim().length === 0) {
    return NextResponse.json({ error: 'Insecticide class is required.' }, { status: 400 });
  }
  if (!VALID_RESULTS.includes(result)) {
    return NextResponse.json({ error: 'Invalid result value.' }, { status: 400 });
  }
  if (!test_date || isNaN(Date.parse(test_date))) {
    return NextResponse.json({ error: 'Invalid test date.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('resistance_tests')
    .insert({
      district_id: profile.district_id,
      vector_species: vector_species.trim(),
      insecticide_class,
      result,
      test_date,
      recorded_by: profile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ test: data }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('resistance_tests')
    .select('id, vector_species, insecticide_class, result, test_date, districts(name)')
    .order('test_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tests: data });
}
