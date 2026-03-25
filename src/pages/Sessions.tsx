import { useEffect, useState } from 'react';
import { sessionService } from '../services/session.service';
import { XCircle, Trash2, Calendar, Clock, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

interface Session {
  _id: string; userId: string; counselorId?: string; providerName?: string;
  providerQualification?: string; title?: string; dateTime: string;
  durationMin: number; status: string; meetingLink?: string; createdAt: string;
}

const STATUS_CFG = {
  upcoming: { pill: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-400', label: 'Upcoming' },
  'in-progress': { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'In Progress' },
  completed: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Completed' },
  cancelled: { pill: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Cancelled' },
} as const;

const STATUSES = ['', 'upcoming', 'in-progress', 'completed', 'cancelled'] as const;

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getAll({ page, limit: 10, status: statusFilter || undefined });
      setSessions(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [page, statusFilter]);

  const handleCancel = async (id: string) => {
    const lid = toast.loading('Cancelling…');
    try {
      await sessionService.cancel(id);
      setSessions(s => s.map(x => x._id === id ? { ...x, status: 'cancelled' } : x));
      toast.success('Session cancelled', { id: lid });
    } catch {
      toast.error('Failed to cancel', { id: lid });
    }
  };

  const handleDelete = (session: Session) => {
    toast(t => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900">Delete this session?</p>
        <p className="text-xs text-slate-500">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const lid = toast.loading('Deleting…');
            try {
              await sessionService.delete(session._id);
              setSessions(s => s.filter(x => x._id !== session._id));
              toast.success('Session deleted', { id: lid });
            } catch {
              toast.error('Failed to delete', { id: lid });
            }
          }}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </div>
    ));
  };

  const counts = STATUSES.slice(1).reduce((acc, s) => ({
    ...acc,
    [s]: sessions.filter(x => x.status === s).length,
  }), {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sessions</h2>
          <p className="text-slate-500 mt-1">Monitor and manage therapy sessions across the platform.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white border border-slate-100 rounded-2xl px-4 py-2 font-medium shadow-sm">
          {total.toLocaleString()} total session{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Status pills ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} className={cn('rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all', cfg.pill,
            statusFilter === key ? 'ring-2 ring-offset-2 ring-teal-500' : 'hover:shadow-sm'
          )} onClick={() => { setStatusFilter(statusFilter === key ? '' : key); setPage(1); }}>
            <span className="text-sm font-bold">{cfg.label}</span>
            <span className="text-xl font-black">{counts[key] || 0}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s || 'all'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                statusFilter === s ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/80">
                {['Provider', 'Date & Duration', 'Status', ''].map(h => (
                  <th key={h} className={cn(
                    'px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center">
                  <Spinner size="lg" className="mx-auto text-teal-500 mb-3" />
                  <p className="text-slate-400 font-medium animate-pulse">Loading sessions…</p>
                </td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-900">No sessions found</p>
                  <p className="text-sm text-slate-500 mt-1">Try adjusting your filter.</p>
                </td></tr>
              ) : sessions.map(s => {
                const cfg = STATUS_CFG[s.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.cancelled;
                return (
                  <tr key={s._id} className="group hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{s.providerName || s.title || 'Unnamed Session'}</p>
                      {s.providerQualification && (
                        <p className="text-xs text-slate-400 mt-0.5">{s.providerQualification}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(s.dateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" /> {s.durationMin} min
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', cfg.pill)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {s.status !== 'cancelled' && s.status !== 'completed' && (
                          <button
                            onClick={() => handleCancel(s._id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                            title="Cancel session"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Page <span className="font-bold text-slate-700">{page}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}