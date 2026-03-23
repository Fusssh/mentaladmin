import { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, CheckCircle, XCircle, Eye, Users as UsersIcon, Calendar } from 'lucide-react';

interface Doctor {
  _id: string;
  username: string;
  email: string;
  role: string;
  blocked: boolean;
  isVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

interface Client {
  _id: string;
  clientId: { _id: string; username: string; email: string };
  status: string;
  createdAt: string;
}

interface Session {
  _id: string;
  userId: string;
  providerName: string;
  providerQualification: string;
  dateTime: string;
  durationMin: number;
  status: string;
  createdAt: string;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail panel
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (filter === 'pending') params.set('isVerified', 'false');
      const res = await api.get(`/admin/doctors?${params}`);
      setDoctors(res.data.items || []);
      setTotalPages(Math.ceil((res.data.total || 0) / 10));
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(t);
  }, [page, search, filter]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/doctors/${id}/approve`);
      setDoctors(d => d.map(doc => doc._id === id ? { ...doc, isVerified: true } : doc));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/admin/doctors/${id}/reject`);
      setDoctors(d => d.map(doc => doc._id === id ? { ...doc, isVerified: false } : doc));
    } catch (err) { console.error(err); }
  };

  const openDetails = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDetailLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.get(`/admin/doctors/${doctor._id}/clients`),
        api.get(`/admin/doctors/${doctor._id}/sessions`),
      ]);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
      setSessions(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Doctor Management</h2>
          <p className="mt-1 text-sm text-gray-500">Approve, reject, and monitor registered doctors.</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => { setFilter(e.target.value as 'all'|'pending'); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500">
            <option value="all">All Doctors</option>
            <option value="pending">Pending Approval</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Registered</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading…</td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No doctors found.</td></tr>
              ) : doctors.map(doc => (
                <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-medium text-sm">
                        {doc.username?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{doc.username}</div>
                        <div className="text-sm text-gray-500">{doc.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{doc.isVerified
                    ? <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full"><CheckCircle className="w-3 h-3 mr-1"/>Verified</span>
                    : <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full"><XCircle className="w-3 h-3 mr-1"/>Pending</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openDetails(doc)} className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-50" title="View Details"><Eye className="w-5 h-5"/></button>
                    {!doc.isVerified && <button onClick={() => handleApprove(doc._id)} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50" title="Approve"><CheckCircle className="w-5 h-5"/></button>}
                    {doc.isVerified && <button onClick={() => handleReject(doc._id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Reject"><XCircle className="w-5 h-5"/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-emerald-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedDoctor.username}</h3>
                <p className="text-emerald-100 text-sm">{selectedDoctor.email}</p>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {detailLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"/></div>
              ) : (
                <>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 flex items-center mb-4"><UsersIcon className="w-5 h-5 mr-2 text-emerald-600"/>Linked Clients ({clients.length})</h4>
                    {clients.length === 0 ? <p className="text-gray-400 text-sm">No linked clients.</p> : (
                      <div className="grid gap-3">
                        {clients.map(c => (
                          <div key={c._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div>
                              <p className="font-medium text-gray-900">{c.clientId?.username || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{c.clientId?.email}</p>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 flex items-center mb-4"><Calendar className="w-5 h-5 mr-2 text-emerald-600"/>Sessions ({sessions.length})</h4>
                    {sessions.length === 0 ? <p className="text-gray-400 text-sm">No sessions.</p> : (
                      <div className="grid gap-3">
                        {sessions.map(s => (
                          <div key={s._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div>
                              <p className="font-medium text-gray-900">{s.providerName}</p>
                              <p className="text-xs text-gray-500">{new Date(s.dateTime).toLocaleString()} · {s.durationMin} min</p>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor(s.status)}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-end">
              <button onClick={() => setSelectedDoctor(null)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
