import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import Nav from '../Nav';

async function getDashboardData(profileRole) {
  // Server component: query directly via the server Supabase client
  // rather than fetching our own API route, to avoid an extra network hop.
  const supabase = await createClient();
  const [{ data: districts }, { data: disposalItems }, { data: resistanceTests }] = await Promise.all([
    supabase.from('districts').select('id, name, region'),
    supabase.from('disposal_items').select('id, status, due_date, distribution_cycles(district_id)'),
    supabase.from('resistance_tests').select('district_id, insecticide_class, result'),
  ]);

  const today = new Date();
  const disposalByDistrict = {};
  for (const item of disposalItems ?? []) {
    const districtId = item.distribution_cycles?.district_id;
    if (!districtId) continue;
    disposalByDistrict[districtId] ??= { total: 0, done: 0, overdue: 0 };
    disposalByDistrict[districtId].total += 1;
    if (item.status !== 'pending') disposalByDistrict[districtId].done += 1;
    else if (new Date(item.due_date) < today) disposalByDistrict[districtId].overdue += 1;
  }

  const hotspots = {};
  for (const test of resistanceTests ?? []) {
    if (test.result !== 'resistant') continue;
    const key = `${test.district_id}::${test.insecticide_class}`;
    hotspots[key] = (hotspots[key] || 0) + 1;
  }

  const rows = (districts ?? []).map((d) => {
    const disposal = disposalByDistrict[d.id] || { total: 0, done: 0, overdue: 0 };
    const complianceRate = disposal.total > 0 ? Math.round((disposal.done / disposal.total) * 100) : null;
    const districtHotspots = Object.entries(hotspots)
      .filter(([key]) => key.startsWith(`${d.id}::`))
      .map(([key, count]) => `${key.split('::')[1]} (${count})`);
    return {
      ...d,
      complianceRate,
      overdue: disposal.overdue,
      total: disposal.total,
      hotspots: districtHotspots,
    };
  });

  return {
    rows,
    totalOverdue: rows.reduce((s, r) => s + r.overdue, 0),
    districtsNeedingAction: rows.filter((r) => r.overdue > 0).length,
    totalResistantFindings: Object.values(hotspots).reduce((a, b) => a + b, 0),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect('/distribution');

  const { rows, totalOverdue, districtsNeedingAction, totalResistantFindings } = await getDashboardData(
    profile.role
  );

  return (
    <>
      <Nav />
      <div className="container">
        <h1>National Programme Dashboard</h1>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-number">{rows.length}</div>
            <div className="stat-label">Districts tracked</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalOverdue}</div>
            <div className="stat-label">Overdue disposal items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{districtsNeedingAction}</div>
            <div className="stat-label">Districts needing redistribution</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalResistantFindings}</div>
            <div className="stat-label">Confirmed resistance findings</div>
          </div>
        </div>

        <h2 style={{ marginTop: 32 }}>By District</h2>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>Region</th>
                <th>Disposal Compliance</th>
                <th>Overdue</th>
                <th>Resistance Hotspots</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.region}</td>
                  <td>{r.complianceRate === null ? '—' : `${r.complianceRate}%`}</td>
                  <td>
                    {r.overdue > 0 ? (
                      <span className="badge badge-overdue">{r.overdue}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td>
                    {r.hotspots.length > 0 ? (
                      r.hotspots.join(', ')
                    ) : (
                      <span style={{ color: '#6b7280' }}>None</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: '#6b7280' }}>
                    No districts found. Seed the database first (see supabase/seed.sql).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
