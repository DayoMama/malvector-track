import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import Nav from '../Nav';
import DisposalRow from './DisposalRow';

export default async function DisposalPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect('/login');

  const { data: items } = await supabase
    .from('disposal_items')
    .select(
      'id, due_date, status, action_date, distribution_cycles(intervention_type, distribution_date, districts(name))'
    )
    .order('due_date', { ascending: true });

  const today = new Date();

  return (
    <>
      <Nav />
      <div className="container">
        <h1>Disposal &amp; Replacement Tracking</h1>
        <p style={{ color: '#6b7280' }}>
          Items are automatically flagged once their effective-life threshold is reached (FR-3).
        </p>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Due Date</th>
                <th>District</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => {
                const overdue = item.status === 'pending' && new Date(item.due_date) < today;
                return (
                  <tr key={item.id}>
                    <td>{item.due_date}</td>
                    <td>{item.distribution_cycles?.districts?.name}</td>
                    <td>{item.distribution_cycles?.intervention_type}</td>
                    <td>
                      <span
                        className={`badge ${
                          overdue ? 'badge-overdue' : `badge-${item.status}`
                        }`}
                      >
                        {overdue ? 'overdue' : item.status}
                      </span>
                    </td>
                    <td>
                      <DisposalRow id={item.id} status={item.status} />
                    </td>
                  </tr>
                );
              })}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ color: '#6b7280' }}>
                    No disposal items yet — these are created automatically when a
                    distribution cycle is logged.
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
