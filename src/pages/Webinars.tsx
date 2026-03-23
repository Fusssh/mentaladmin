import { useEffect, useState } from 'react';
import { webinarService } from '../services/webinar.service';
import { userService } from '../services/user.service';
import { Plus, Edit, Trash2, XCircle, X, Calendar, Users as UsersIcon, Clock } from 'lucide-react';

interface Webinar {
  _id: string; title: string; description: string; scheduledAt: string;
  durationMinutes: number; hostId: any; createdBy: any; status: string;
  roomName: string; thumbnail: string|null; maxParticipants: number;
  registeredUsers: string[]; joinedUsers: string[]; createdAt: string;
}

interface Doctor { _id: string; username: string; email: string; }

const emptyForm = { title: '', description: '', scheduledAt: '', durationMinutes: 60, hostId: '', maxParticipants: 100 };

export default function Webinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Webinar | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWebinars = async () => {
    setLoading(true);
    try {
      const params = filter ? (filter === 'upcoming' ? { upcoming: true } : { status: filter }) : undefined;
      const data = await webinarService.getAll(params);
      setWebinars(Array.isArray(data) ? data : data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDoctors = async () => {
    try {
      const data = await userService.getDoctors({ approved: true });
      setDoctors(data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchWebinars(); }, [filter]);
  useEffect(() => { fetchDoctors(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (w: Webinar) => {
    setEditing(w);
    setForm({ title: w.title, description: w.description, scheduledAt: w.scheduledAt.slice(0, 16), durationMinutes: w.durationMinutes, hostId: typeof w.hostId === 'object' ? w.hostId._id : w.hostId, maxParticipants: w.maxParticipants });
    setShowForm(true);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
      if (editing) { await webinarService.update(editing._id, body); }
      else { await webinarService.create(body); }
      setShowForm(false); fetchWebinars();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    try { await webinarService.cancel(id); fetchWebinars(); } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this webinar?')) return;
    try { await webinarService.delete(id); setWebinars(w => w.filter(x => x._id !== id)); } catch (e) { console.error(e); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-700', live: 'bg-green-100 text-green-700 animate-pulse', ended: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webinar Management</h2>
          <p className="mt-1 text-sm text-gray-500">Create, schedule, and manage live webinars.</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Webinars</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live Now</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700"><Plus className="w-4 h-4" />New Webinar</button>
        </div>
      </div>

      {/* Webinar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? [1,2,3].map(i => <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse" />) : webinars.length === 0 ? (
          <p className="col-span-3 text-center text-gray-400 py-10">No webinars found.</p>
        ) : webinars.map(w => (
          <div key={w._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusBadge(w.status)}`}>{w.status === 'live' ? '● LIVE' : w.status}</span>
                <div className="flex gap-1">
                  {w.status === 'scheduled' && <button onClick={() => openEdit(w)} className="p-1 text-gray-400 hover:text-sky-600 rounded"><Edit className="w-4 h-4" /></button>}
                  {(w.status === 'scheduled' || w.status === 'live') && <button onClick={() => handleCancel(w._id)} className="p-1 text-gray-400 hover:text-orange-600 rounded" title="Cancel"><XCircle className="w-4 h-4" /></button>}
                  {w.status !== 'live' && <button onClick={() => handleDelete(w._id)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{w.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{w.description}</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(w.scheduledAt).toLocaleString()}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{w.durationMinutes} min</div>
                <div className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" />{w.registeredUsers?.length || 0} / {w.maxParticipants} registered</div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t text-xs text-gray-500">
              Host: <span className="font-medium text-gray-700">{typeof w.hostId === 'object' ? w.hostId.username : w.hostId}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-bold">{editing ? 'Edit Webinar' : 'Create Webinar'}</h3><button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Scheduled At</label><input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label><input required type="number" min={15} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Host (Doctor)</label>
                  <select required value={form.hostId} onChange={e => setForm({ ...form, hostId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select doctor…</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.username} ({d.email})</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Max Participants</label><input required type="number" min={1} value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
