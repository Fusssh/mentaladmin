import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import { Search, Eye, HeartPulse, BookOpen, ListChecks, Brain } from 'lucide-react';

interface Patient {
  _id: string; username: string; email: string; blocked: boolean;
  isVerified: boolean; onboardingCompleted: boolean; createdAt: string;
  assessmentDocs?: any; wellnessProfile?: any;
}

interface Activity {
  mood: any[]; sessions: any[]; journals: any[]; tasks: any[]; quizResults: any[];
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [actLoading, setActLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({ role: 'patient', page, limit: 10, search });
      setPatients(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchPatients, 400);
    return () => clearTimeout(t);
  }, [page, search]);

  const openActivity = async (p: Patient) => {
    setSelected(p);
    setActLoading(true);
    try {
      const data = await userService.getPatientActivity(p._id);
      setActivity(data);
    } catch (err) { console.error(err); }
    finally { setActLoading(false); }
  };

  const moodEmoji = (v: number) => ['😞','😟','😐','🙂','😊','😁'][Math.min(v, 5)] || '😐';
  const statusColor = (s: string) => {
    switch (s) { case 'completed': return 'bg-green-100 text-green-700'; case 'pending': return 'bg-yellow-100 text-yellow-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
          <p className="mt-1 text-sm text-gray-500">View patients and their activity logs.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-sm" />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Focus Area</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Registered</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Loading…</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-medium text-sm">{p.username?.charAt(0).toUpperCase() || 'P'}</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{p.username}</div>
                        <div className="text-sm text-gray-500">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{p.wellnessProfile?.focusArea || 'N/A'}</span></td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">{p.assessmentDocs?.compositeScore ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openActivity(p)} className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-50" title="View Activity"><Eye className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {/* Activity Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-rose-600 text-white">
              <div><h3 className="text-xl font-bold">{selected.username}</h3><p className="text-rose-100 text-sm">{selected.email}</p></div>
              <button onClick={() => { setSelected(null); setActivity(null); }} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {actLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600"/></div>
              ) : activity ? (
                <>
                  <div>
                    <h4 className="text-lg font-bold flex items-center mb-3"><HeartPulse className="w-5 h-5 mr-2 text-rose-500"/>Mood Logs ({activity.mood.length})</h4>
                    <div className="flex flex-wrap gap-3">
                      {activity.mood.length === 0 ? <p className="text-gray-400 text-sm">No mood logs.</p> : activity.mood.map((m: any) => (
                        <div key={m._id} className="bg-gray-50 rounded-xl px-4 py-3 border text-center min-w-[100px]">
                          <span className="text-2xl">{moodEmoji(m.mood)}</span>
                          <p className="text-xs text-gray-500 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold flex items-center mb-3"><Brain className="w-5 h-5 mr-2 text-indigo-500"/>Sessions ({activity.sessions.length})</h4>
                    {activity.sessions.length === 0 ? <p className="text-gray-400 text-sm">No sessions.</p> : (
                      <div className="space-y-2">{activity.sessions.map((s: any) => (
                        <div key={s._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border">
                          <div><p className="font-medium text-gray-900">{s.providerName || 'Session'}</p><p className="text-xs text-gray-500">{new Date(s.dateTime).toLocaleString()} · {s.durationMin} min</p></div>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor(s.status)}`}>{s.status}</span>
                        </div>
                      ))}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold flex items-center mb-3"><BookOpen className="w-5 h-5 mr-2 text-amber-500"/>Journals ({activity.journals.length})</h4>
                    {activity.journals.length === 0 ? <p className="text-gray-400 text-sm">No journals.</p> : (
                      <div className="space-y-2">{activity.journals.map((j: any) => (
                        <div key={j._id} className="bg-gray-50 rounded-xl p-4 border">
                          <p className="font-medium text-gray-900">{j.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{j.mood && <span className="mr-2">Mood: {j.mood}</span>}{new Date(j.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold flex items-center mb-3"><ListChecks className="w-5 h-5 mr-2 text-green-500"/>Tasks ({activity.tasks.length})</h4>
                    {activity.tasks.length === 0 ? <p className="text-gray-400 text-sm">No tasks.</p> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{activity.tasks.map((t: any) => (
                        <div key={t._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border">
                          <div><p className="text-sm font-medium text-gray-900">{t.title}</p><p className="text-xs text-gray-500">{t.category}</p></div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                        </div>
                      ))}</div>
                    )}
                  </div>
                  {activity.quizResults && activity.quizResults.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold flex items-center mb-3"><Brain className="w-5 h-5 mr-2 text-purple-500"/>Quiz Results ({activity.quizResults.length})</h4>
                      <div className="space-y-2">{activity.quizResults.map((q: any) => (
                        <div key={q._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border">
                          <div><p className="font-medium text-gray-900">{q.quizId?.title || 'Quiz'}</p><p className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</p></div>
                          <span className="text-lg font-bold text-purple-600">{q.score} pts</span>
                        </div>
                      ))}</div>
                    </div>
                  )}
                </>
              ) : <p className="text-gray-400 text-center py-8">No activity data.</p>}
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-end">
              <button onClick={() => { setSelected(null); setActivity(null); }} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
