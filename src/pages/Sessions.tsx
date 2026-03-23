import { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, XCircle, Trash2 } from 'lucide-react';

interface Session {
  _id: string;
  userId: string;
  counselorId?: string;
  providerName?: string;
  providerQualification?: string;
  title?: string;
  dateTime: string;
  durationMin: number;
  status: string;
  meetingLink?: string;
  createdAt: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/sessions?${params}`);
      setSessions(res.data.items || []);
      setTotalPages(Math.ceil((res.data.total || 0) / 10));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [page, statusFilter]);

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/admin/sessions/${id}/cancel`);
      setSessions(s => s.map(x => x._id === id ? { ...x, status: 'cancelled' } : x));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this session permanently?')) return;
    try {
      await api.delete(`/admin/sessions/${id}`);
      setSessions(s => s.filter(x => x._id !== id));
    } catch (err) { console.error(err); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
          <p className="mt-1 text-sm text-gray-500">Monitor and manage therapy sessions.</p>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-sky-500">
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date & Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading…</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No sessions found.</td></tr>
              ) : sessions.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{s.providerName || s.title || 'Session'}</p>
                    {s.providerQualification && <p className="text-xs text-gray-500">{s.providerQualification}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{new Date(s.dateTime).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{s.durationMin} min</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {s.status !== 'cancelled' && s.status !== 'completed' && (
                      <button onClick={() => handleCancel(s._id)} className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50" title="Cancel"><XCircle className="w-5 h-5"/></button>
                    )}
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-5 h-5"/></button>
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
    </div>
  );
}
