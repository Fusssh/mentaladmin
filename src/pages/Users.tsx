import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import {
  Search, ShieldAlert, Trash2, Eye, Users as UsersIcon,
  UserCheck, UserX, Stethoscope, ShieldCheck,
} from 'lucide-react';
import UserDetails from '../components/UserDetails';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  blocked: boolean;
  onboardingCompleted: boolean;
  isVerified: boolean;
  createdAt: string;
  wellnessProfile?: any;
  assessmentDocs?: any;
}

const ROLE_CFG = {
  admin: { pill: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-400', icon: ShieldCheck },
  doctor: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: Stethoscope },
  patient: { pill: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-400', icon: UsersIcon },
} as const;

const FILTERS = ['all', 'patient', 'doctor', 'admin'] as const;

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page,
        limit: 20,
      });
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 400);
    return () => clearTimeout(t);
  }, [page, search, roleFilter]);

  const handleBlockToggle = async (user: User) => {
    const action = user.blocked ? 'unblock' : 'block';
    const lid = toast.loading(`${user.blocked ? 'Unblocking' : 'Blocking'} user…`);
    try {
      await userService.blockUser(user._id, !user.blocked);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, blocked: !user.blocked } : u));
      toast.success(`User ${action}ed`, { id: lid });
    } catch {
      toast.error(`Failed to ${action} user`, { id: lid });
    }
  };

  const handleDelete = (user: User) => {
    toast(t => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900">Delete <span className="text-teal-600">{user.username}</span>?</p>
        <p className="text-xs text-slate-500">This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const lid = toast.loading('Deleting…');
            try {
              await userService.deleteUser(user._id);
              setUsers(prev => prev.filter(u => u._id !== user._id));
              toast.success('User deleted', { id: lid });
            } catch {
              toast.error('Failed to delete', { id: lid });
            }
          }}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </div>
    ));
  };

  const roleCounts = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page header ── */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Users</h2>
        <p className="text-slate-500 mt-1">Manage patients, doctors, and admin accounts.</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, cls: 'bg-slate-900 text-white' },
          { label: 'Patients', value: roleCounts.patient || 0, cls: 'bg-sky-50 text-sky-700' },
          { label: 'Doctors', value: roleCounts.doctor || 0, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Admins', value: roleCounts.admin || 0, cls: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-4 flex items-center justify-between', s.cls)}>
            <span className="text-sm font-bold opacity-70">{s.label}</span>
            <span className="text-2xl font-black">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name or email…"
            className="w-full pl-11 pr-4 py-2 border-none bg-slate-50/50 hover:bg-slate-50 focus:bg-slate-50 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                roleFilter === f ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}>
              {f}
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
                {['User', 'Role', 'Status', 'Joined', ''].map(h => (
                  <th key={h} className={cn(
                    'px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Spinner size="lg" className="mx-auto text-teal-500 mb-3" />
                    <p className="text-slate-400 font-medium animate-pulse">Loading users…</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                      <UsersIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-900">No users found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              ) : users.map(user => {
                const cfg = ROLE_CFG[user.role as keyof typeof ROLE_CFG] ?? ROLE_CFG.patient;
                const RoleIcon = cfg.icon;
                const initials = (user.username || 'U').slice(0, 2).toUpperCase();
                return (
                  <tr key={user._id} className="group hover:bg-slate-50/80 transition-colors">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.username || 'Unnamed'}</p>
                          <p className="text-xs text-slate-400">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', cfg.pill)}>
                        <RoleIcon className="w-3 h-3" /> {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                          <UserX className="w-3 h-3" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleBlockToggle(user)}
                              className={cn(
                                'p-2 rounded-xl transition-all',
                                user.blocked
                                  ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                              )}
                              title={user.blocked ? 'Unblock' : 'Block'}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Page <span className="text-slate-700 font-bold">{page}</span> of <span className="text-slate-700 font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetails userId={selectedUser._id} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}