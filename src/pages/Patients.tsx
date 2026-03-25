import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import {
  Search, Eye, HeartPulse, BookOpen, ListChecks,
  Brain, X, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  _id: string; username: string; email: string; blocked: boolean;
  isVerified: boolean; onboardingCompleted: boolean; createdAt: string;
  assessmentDocs?: any; wellnessProfile?: any;
}

interface Activity {
  mood: any[]; sessions: any[]; journals: any[]; tasks: any[]; quizResults: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moodEmoji = (v: number) => ['😞', '😟', '😐', '🙂', '😊', '😁'][Math.min(v, 5)] ?? '😐';

const STATUS_CLS: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-500',
  'in-progress': 'bg-sky-50 text-sky-700',
};
const statusCls = (s: string) => STATUS_CLS[s] ?? 'bg-slate-100 text-slate-500';

// ─── Activity section header ──────────────────────────────────────────────────

function ActivitySection({
  icon: Icon, color, title, count, children
}: { icon: React.ElementType; color: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn('p-2 rounded-xl', color)}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
        <Badge variant="outline" className="ml-auto text-[10px] font-bold text-slate-400 border-slate-200">{count}</Badge>
      </div>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  const closeModal = () => { setSelected(null); setActivity(null); };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Admin</p>
          <h2 className="text-3xl font-black text-slate-900">Patients</h2>
          <p className="text-slate-400 mt-1 text-sm">View patient profiles and activity logs.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search patients…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-11 bg-white border-slate-200"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Patient', 'Focus Area', 'Score', 'Registered', ''].map(h => (
                  <th key={h} className={cn(
                    'px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center">
                  <Spinner size="lg" className="mx-auto text-rose-400" />
                </td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-sm shrink-0">
                        {p.username?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.username}</p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-sky-50 text-sky-700 border-none text-[10px] font-bold">
                      {p.wellnessProfile?.focusArea || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-700 tabular-nums">
                      {p.assessmentDocs?.compositeScore ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => openActivity(p)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-8 w-8 p-0 rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-8 w-8 p-0 rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════ Activity Modal ════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* header */}
            <div className="flex items-center justify-between px-7 py-5 bg-rose-600 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {selected.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-white text-lg leading-tight">{selected.username}</p>
                  <p className="text-rose-200 text-xs">{selected.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 py-7 space-y-8 custom-scrollbar">
              {actLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" className="text-rose-500" />
                </div>
              ) : activity ? (
                <>
                  {/* Mood */}
                  <ActivitySection icon={HeartPulse} color="bg-rose-50 text-rose-500" title="Mood Logs" count={activity.mood.length}>
                    {activity.mood.length === 0 ? <Empty /> : (
                      <div className="flex flex-wrap gap-2">
                        {activity.mood.map((m: any) => (
                          <div key={m._id} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-center min-w-[80px]">
                            <span className="text-2xl">{moodEmoji(m.mood)}</span>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ActivitySection>

                  {/* Sessions */}
                  <ActivitySection icon={Brain} color="bg-indigo-50 text-indigo-500" title="Sessions" count={activity.sessions.length}>
                    {activity.sessions.length === 0 ? <Empty /> : (
                      <div className="space-y-2">
                        {activity.sessions.map((s: any) => (
                          <div key={s._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{s.providerName || 'Session'}</p>
                              <p className="text-xs text-slate-400">{new Date(s.dateTime).toLocaleString()} · {s.durationMin} min</p>
                            </div>
                            <Badge className={cn('border-none text-[10px] font-bold', statusCls(s.status))}>{s.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ActivitySection>

                  {/* Journals */}
                  <ActivitySection icon={BookOpen} color="bg-amber-50 text-amber-500" title="Journals" count={activity.journals.length}>
                    {activity.journals.length === 0 ? <Empty /> : (
                      <div className="space-y-2">
                        {activity.journals.map((j: any) => (
                          <div key={j._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="font-bold text-slate-900 text-sm">{j.title}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {j.mood && <span className="mr-2">Mood: {j.mood}</span>}
                              {new Date(j.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ActivitySection>

                  {/* Tasks */}
                  <ActivitySection icon={ListChecks} color="bg-emerald-50 text-emerald-600" title="Tasks" count={activity.tasks.length}>
                    {activity.tasks.length === 0 ? <Empty /> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activity.tasks.map((t: any) => (
                          <div key={t._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{t.title}</p>
                              <p className="text-xs text-slate-400">{t.category}</p>
                            </div>
                            <Badge className={cn('border-none text-[10px] font-bold', statusCls(t.status))}>{t.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ActivitySection>

                  {/* Quiz results */}
                  {activity.quizResults?.length > 0 && (
                    <ActivitySection icon={Brain} color="bg-violet-50 text-violet-600" title="Quiz Results" count={activity.quizResults.length}>
                      <div className="space-y-2">
                        {activity.quizResults.map((q: any) => (
                          <div key={q._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{q.quizId?.title || 'Quiz'}</p>
                              <p className="text-xs text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-lg font-black text-violet-600">{q.score} pts</span>
                          </div>
                        ))}
                      </div>
                    </ActivitySection>
                  )}
                </>
              ) : <p className="text-slate-400 text-center py-12 text-sm">No activity data.</p>}
            </div>

            {/* footer */}
            <div className="px-7 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <Button variant="outline" onClick={closeModal} className="rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-slate-300 text-sm py-2">Nothing recorded yet.</p>;
}