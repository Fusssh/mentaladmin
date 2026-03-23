import { useState } from 'react';
import api from '../services/api';
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

export default function Settings() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/admin/users/create-admin', form);
      setMsg({ type: 'success', text: 'Admin account created successfully.' });
      setForm({ username: '', email: '', password: '', fullName: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create admin.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">System configuration and admin management.</p>
      </div>

      {/* Secret Admin Creation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setShowAdmin(!showAdmin)}
          className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Admin Account Management</p>
              <p className="text-xs text-gray-500">Create new administrator accounts (restricted)</p>
            </div>
          </div>
          <ShieldCheck className={`w-5 h-5 text-gray-400 transition-transform ${showAdmin ? 'rotate-180' : ''}`} />
        </button>

        {showAdmin && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-red-700 font-medium">⚠️ This action creates a new admin with full system access. Use with caution.</p>
            </div>

            {msg && (
              <div className={`rounded-xl p-3 mb-4 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="Admin Two" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="admin2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="admin2@mentalhealth.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input required type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="SecurePass@123" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating…' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
