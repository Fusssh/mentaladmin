import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import {
  Search, CheckCircle, XCircle, Eye,
  Users as UsersIcon, Calendar, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
  _id: string; username: string; email: string; role: string;
  blocked: boolean; isVerified: boolean; onboardingCompleted: boolean; createdAt: string;
}
interface Client {
  _id: string; clientId: { _id: string; username: string; email: string };
  status: string; createdAt: string;
}
interface Session {
  _id: string; userId: string; providerName: string; providerQualification: string;
  dateTime: string; durationMin: number; status: string; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_CLS: Record<string, string> = {
  upcoming: 'bg-sky-50 text-sky-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-500',
};
const statusCls = (s: string) => SESSION_CLS[s] ?? 'bg-slate-100 text-slate-500';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await userService.getDoctors({
        page, limit: 10, search,
        isVerified: filter === 'pending' ? false : undefined,
      });
      setDoctors(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(t);
  }, [page, search, filter]);

  const handleApprove = async (id: string) => {
    try {
      await userService.approveDoctor(id);
      setDoctors(d => d.map(doc => doc._id === id ? { ...doc, isVerified: true } : doc));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    try {
      await userService.rejectDoctor(id);
      setDoctors(d => d.map(doc => doc._id === id ? { ...doc, isVerified: false } : doc));
    } catch (err) { console.error(err); }
  };

  const openDetails = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDetailLoading(true);
    try {
      const [cData, sData] = await Promise.all([
        userService.getDoctorClients(doctor._id),
        userService.getDoctorSessions(doctor._id),
      ]);
      setClients(Array.isArray(cData) ? cData : []);
      setSessions(Array.isArray(sData) ? sData : []);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const closeModal = () => setSelectedDoctor(null);

  const pendingCount = doctors.filter(d => !d.isVerified).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Admin</p>
          <h2 className="text-3xl font-black text-slate-900">Doctors</h2>
          <p className="text-slate-400 mt-1 text-sm">Approve, reject and monitor registered doctors.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Filter pills */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {([['all', 'All'], ['pending', 'Pending']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setFilter(val); setPage(1); }}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative',
                  filter === val ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                )}>
                {label}
                {val === 'pending' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-black flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search doctors…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-11 bg-white border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Doctor', 'Status', 'Registered', ''].map(h => (
                  <th key={h} className={cn(
                    'px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center">
                  <Spinner size="lg" className="mx-auto text-emerald-500" />
                </td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm">No doctors found.</td></tr>
              ) : doctors.map(doc => (
                <tr key={doc._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                        {doc.username?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{doc.username}</p>
                        <p className="text-xs text-slate-400">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {doc.isVerified ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-bold flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-none text-[10px] font-bold flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl"
                        onClick={() => openDetails(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!doc.isVerified && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          onClick={() => handleApprove(doc._id)} title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {doc.isVerified && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                          onClick={() => handleReject(doc._id)} title="Revoke">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════ Doctor Detail Modal ════════════ */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* header */}
            <div className="flex items-center justify-between px-7 py-5 bg-emerald-600 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {selectedDoctor.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-white text-lg leading-tight">{selectedDoctor.username}</p>
                  <p className="text-emerald-200 text-xs">{selectedDoctor.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-7 py-7 space-y-8 custom-scrollbar">
              {detailLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" className="text-emerald-500" />
                </div>
              ) : (
                <>
                  {/* Clients */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><UsersIcon className="w-4 h-4" /></div>
                      <h4 className="font-bold text-slate-900 text-sm">Linked Clients</h4>
                      <Badge variant="outline" className="ml-auto text-[10px] font-bold text-slate-400 border-slate-200">{clients.length}</Badge>
                    </div>
                    {clients.length === 0 ? (
                      <p className="text-slate-300 text-sm py-2">No linked clients.</p>
                    ) : (
                      <div className="space-y-2">
                        {clients.map(c => (
                          <div key={c._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{c.clientId?.username || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{c.clientId?.email}</p>
                            </div>
                            <Badge className={cn('border-none text-[10px] font-bold',
                              c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            )}>{c.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sessions */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600"><Calendar className="w-4 h-4" /></div>
                      <h4 className="font-bold text-slate-900 text-sm">Sessions</h4>
                      <Badge variant="outline" className="ml-auto text-[10px] font-bold text-slate-400 border-slate-200">{sessions.length}</Badge>
                    </div>
                    {sessions.length === 0 ? (
                      <p className="text-slate-300 text-sm py-2">No sessions recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map(s => (
                          <div key={s._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{s.providerName}</p>
                              <p className="text-xs text-slate-400">{new Date(s.dateTime).toLocaleString()} · {s.durationMin} min</p>
                            </div>
                            <Badge className={cn('border-none text-[10px] font-bold', statusCls(s.status))}>{s.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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