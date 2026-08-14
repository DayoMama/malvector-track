import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabaseServer';
import Nav from '../Nav';
import ResistanceForm from './ResistanceForm';

export default async function ResistancePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect('/login');

  const { data: tests } = await supabase
    .from('resistance_tests')
    .select('id, vector_species, insecticide_class, result, test_date, districts(name)')
    .order('test_date', { ascending: false })
    .limit(20);

  return (
    <>
      <Nav />
      <div className="container">
        <h1>Record Resistance Result</h1>
        <div className="card">
          <ResistanceForm />
        </div>

        <h2>Recent Results</h2>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>District</th>
                <th>Species</th>
                <th>Insecticide Class</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {(tests ?? []).map((t) => (
                <tr key={t.id}>
                  <td>{t.test_date}</td>
                  <td>{t.districts?.name}</td>
                  <td>{t.vector_species}</td>
                  <td>{t.insecticide_class}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.result === 'resistant' ? 'badge-overdue' : 'badge-disposed'
                      }`}
                    >
                      {t.result.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {(!tests || tests.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ color: '#6b7280' }}>
                    No resistance results recorded yet.
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
