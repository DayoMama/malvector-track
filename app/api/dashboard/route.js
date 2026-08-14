import { NextResponse } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';

// Aggregation for UC-5 / FR-5. Kept as a handful of targeted queries rather
// than one giant join, since the MVP dataset is small (TD-7 in the
// Technical Debt Plan notes this should move to paginated/windowed queries
// at real-world data volumes).
export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const [{ data: districts }, { data: disposalItems }, { data: resistanceTests }] = await Promise.all([
    supabase.from('districts').select('id, name, region'),
    supabase
      .from('disposal_items')
      .select('id, status, due_date, distribution_cycles(district_id)'),
    supabase
      .from('resistance_tests')
      .select('district_id, insecticide_class, result'),
  ]);

  const today = new Date();

  // Disposal compliance rate per district: disposed+replaced / total.
  const disposalByDistrict = {};
  for (const item of disposalItems ?? []) {
    const districtId = item.distribution_cycles?.district_id;
    if (!districtId) continue;
    disposalByDistrict[districtId] ??= { total: 0, done: 0, overdue: 0 };
    disposalByDistrict[districtId].total += 1;
    if (item.status !== 'pending') {
      disposalByDistrict[districtId].done += 1;
    } else if (new Date(item.due_date) < today) {
      disposalByDistrict[districtId].overdue += 1;
    }
  }

  // Resistance hotspots: districts with a 'resistant' result, by insecticide class.
  const hotspots = {};
  for (const test of resistanceTests ?? []) {
    if (test.result !== 'resistant') continue;
    const key = `${test.district_id}::${test.insecticide_class}`;
    hotspots[key] = (hotspots[key] || 0) + 1;
  }

  const districtSummaries = (districts ?? []).map((d) => {
    const disposal = disposalByDistrict[d.id] || { total: 0, done: 0, overdue: 0 };
    const complianceRate = disposal.total > 0 ? Math.round((disposal.done / disposal.total) * 100) : null;
    const districtHotspots = Object.entries(hotspots)
      .filter(([key]) => key.startsWith(`${d.id}::`))
      .map(([key, count]) => ({ insecticide_class: key.split('::')[1], resistant_count: count }));

    return {
      district_id: d.id,
      name: d.name,
      region: d.region,
      disposal_compliance_rate: complianceRate,
      disposal_overdue: disposal.overdue,
      disposal_total: disposal.total,
      resistance_hotspots: districtHotspots,
      needs_redistribution: disposal.overdue > 0,
    };
  });

  const totals = {
    districts: districtSummaries.length,
    disposal_overdue: districtSummaries.reduce((s, d) => s + d.disposal_overdue, 0),
    districts_needing_redistribution: districtSummaries.filter((d) => d.needs_redistribution).length,
    resistant_findings: Object.values(hotspots).reduce((a, b) => a + b, 0),
  };

  return NextResponse.json({ totals, districts: districtSummaries });
}
