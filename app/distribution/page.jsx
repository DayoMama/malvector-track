import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import Nav from '../Nav';
import DistributionForm from './DistributionForm';

export default async function DistributionPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect('/login');

  const { data: cycles } = await supabase
    .from('distribution_cycles')
    .select('id, intervention_type, distribution_date, quantity, households_covered, districts(name)')
    .order('distribution_date', { ascending: false })
    .limit(20);

  return (
    <>
      <Nav />
      <div className="container">
        <h1>Log Distribution Cycle</h1>
        <div className="card">
          <DistributionForm districtId={profile.district_id} />
        </div>

        <h2>Recent Cycles — {profile.role === 'admin' ? 'All Districts' : 'Your District'}</h2>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>District</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Households</th>
              </tr>
            </thead>
            <tbody>
              {(cycles ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{c.distribution_date}</td>
                  <td>{c.districts?.name}</td>
                  <td>{c.intervention_type}</td>
                  <td>{c.quantity}</td>
                  <td>{c.households_covered}</td>
                </tr>
              ))}
              {(!cycles || cycles.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ color: '#6b7280' }}>
                    No distribution cycles recorded yet.
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
