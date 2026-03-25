import { useEffect, useState } from 'react';
import { webinarService } from '../services/webinar.service';
import { userService } from '../services/user.service';
import {
  Plus, Edit, Trash2, XCircle, X, Calendar,
  Users as UsersIcon, Clock, Video, Radio,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

interface Webinar {
  _id: string; title: string; description: string; scheduledAt: string;
  durationMinutes: number; hostId: any; createdBy: any; status: string;
  roomName: string; thumbnail: string | null; maxParticipants: number;
  registeredUsers: string[]; joinedUsers: string[]; createdAt: string;
}
interface Doctor { _id: string; username: string; email: string; }

const STATUS_CFG = {
  scheduled: { pill: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-400', label: 'Scheduled' },
  live: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Live' },
  ended: { pill: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Ended' },
  cancelled: { pill: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400', label: 'Cancelled' },
} as const;

const EMPTY_FORM = { title: '', description: '', scheduledAt: '', durationMinutes: 60, hostId: '', maxParticipants: 100 };
const FILTERS = ['', 'upcoming', 'live', 'ended', 'cancelled'];

export default function Webinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Webinar | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchWebinars = async () => {
    setLoading(true);
    try {
      const params = filter ? (filter === 'upcoming' ? { upcoming: true } : { status: filter }) : undefined;
      const data = await webinarService.getAll(params);
      setWebinars(Array.isArray(data) ? data : data.items || []);
    } catch { toast.error('Failed to load webinars'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWebinars(); }, [filter]);
  useEffect(() => {
    userService.getDoctors({ approved: true }).then(data => setDoctors(data.items || [])).catch(() => { });
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (w: Webinar) => {
    setEditing(w);
    setForm({
      title: w.title, description: w.description,
      scheduledAt: w.scheduledAt.slice(0, 16), durationMinutes: w.durationMinutes,
      hostId: typeof w.hostId === 'object' ? w.hostId._id : w.hostId,
      maxParticipants: w.maxParticipants,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
      if (editing) { await webinarService.update(editing._id, body); toast.success('Webinar updated'); }
      else { await webinarService.create(body); toast.success('Webinar created'); }
      setShowForm(false); fetchWebinars();
    } catch { toast.error('Operation failed'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    const lid = toast.loading('Cancelling…');
    try { await webinarService.cancel(id); toast.success('Cancelled', { id: lid }); fetchWebinars(); }
    catch { toast.error('Failed', { id: lid }); }
  };

  const handleDelete = (w: Webinar) => {
    toast(t => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900">Delete <span className="text-teal-600">{w.title}</span>?</p>
        <p className="text-xs text-slate-500">This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const lid = toast.loading('Deleting…');
            try { await webinarService.delete(w._id); toast.success('Deleted', { id: lid }); setWebinars(prev => prev.filter(x => x._id !== w._id)); }
            catch { toast.error('Failed', { id: lid }); }
          }}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </div>
    ));
  };

  const liveCount = webinars.filter(w => w.status === 'live').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Webinars</h2>
          <p className="text-slate-500 mt-1">Create, schedule, and manage live webinar sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> {liveCount} Live Now
            </div>
          )}
          <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700 shadow-teal-100 shadow-xl">
            <Plus className="w-4 h-4 mr-2" /> New Webinar
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: webinars.length, cls: 'bg-slate-900 text-white' },
          { label: 'Scheduled', value: webinars.filter(w => w.status === 'scheduled').length, cls: 'bg-sky-50 text-sky-700' },
          { label: 'Live', value: webinars.filter(w => w.status === 'live').length, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Ended', value: webinars.filter(w => w.status === 'ended').length, cls: 'bg-slate-50 text-slate-600' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-4 flex items-center justify-between', s.cls)}>
            <span className="text-sm font-bold opacity-70">{s.label}</span>
            <span className="text-2xl font-black">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f || 'all'} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                filter === f ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-slate-100">
            <Spinner size="lg" className="mb-4 text-teal-500" />
            <p className="animate-pulse font-medium text-slate-400">Loading webinars…</p>
          </div>
        ) : webinars.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No webinars found</h3>
            <p className="text-slate-500 mt-2">Create your first webinar to get started.</p>
          </div>
        ) : webinars.map(w => {
          const cfg = STATUS_CFG[w.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ended;
          const registeredPct = Math.min(100, Math.round(((w.registeredUsers?.length || 0) / (w.maxParticipants || 1)) * 100));
          return (
            <div key={w._id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-xl hover:shadow-teal-600/5 transition-all duration-500 flex flex-col overflow-hidden">
              {/* Card top colour bar */}
              <div className={cn('h-1.5 w-full', w.status === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-100')} />

              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', cfg.pill)}>
                    {w.status === 'live' && <Radio className="w-3 h-3 animate-pulse" />}
                    {cfg.label}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {w.status === 'scheduled' && (
                      <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(w.status === 'scheduled' || w.status === 'live') && (
                      <button onClick={() => handleCancel(w._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all" title="Cancel">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {w.status !== 'live' && (
                      <button onClick={() => handleDelete(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">{w.title}</h4>
                  {w.description && <p className="text-sm text-slate-500 line-clamp-2 mt-1">{w.description}</p>}
                </div>

                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" />{new Date(w.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 shrink-0" />{w.durationMinutes} min</div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><UsersIcon className="w-3.5 h-3.5 shrink-0" />{w.registeredUsers?.length || 0} / {w.maxParticipants}</div>
                      <span className="font-bold text-teal-600">{registeredPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${registeredPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500">
                Host: <span className="font-semibold text-slate-700">{typeof w.hostId === 'object' ? w.hostId.username : w.hostId || '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ FORM MODAL ════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-teal-500 mb-0.5">{editing ? 'Editing' : 'New Webinar'}</p>
                <h3 className="text-lg font-bold text-slate-900">{editing ? editing.title : 'Create a webinar'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Scheduled At</label>
                  <input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Duration (min)</label>
                  <input required type="number" min={15} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Host (Doctor)</label>
                  <select required value={form.hostId} onChange={e => setForm({ ...form, hostId: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all">
                    <option value="">Select doctor…</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.username}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Max Participants</label>
                  <input required type="number" min={1} value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
                  {saving ? <><Spinner size="sm" /> Saving…</> : editing ? 'Save Changes' : 'Create Webinar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}