import { useState } from 'react';
import { userService } from '../services/user.service';
import { ShieldCheck, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';

const inputCls = 'w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 transition-all';

export default function Settings() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await userService.createAdmin(form);
      setMsg({ type: 'success', text: 'Admin account created successfully.' });
      setForm({ username: '', email: '', password: '', fullName: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to create admin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">System configuration and administrator management.</p>
      </div>

      <div className="max-w-2xl space-y-4">

        {/* ── Admin Creation Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toggle header */}
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Admin Account Management</p>
                <p className="text-xs text-slate-500 mt-0.5">Create new administrator accounts — restricted access</p>
              </div>
            </div>
            <ShieldCheck className={cn('w-5 h-5 text-slate-400 transition-transform duration-200', showAdmin && 'rotate-180')} />
          </button>

          {showAdmin && (
            <div className="border-t border-slate-100">
              {/* Warning banner */}
              <div className="px-6 pt-5">
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    This creates an admin account with full system access. Only proceed if you are authorised to do so.
                  </p>
                </div>
              </div>

              {/* Feedback message */}
              {msg && (
                <div className="px-6 pt-4">
                  <div className={cn('flex gap-3 p-4 rounded-xl border text-sm font-medium',
                    msg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  )}>
                    {msg.type === 'success'
                      ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    }
                    {msg.text}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block">Full Name</label>
                    <input
                      required
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Admin Two"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block">Username</label>
                    <input
                      required
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      placeholder="admin2"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="admin2@mentalhealth.com"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="SecurePass@123"
                      className={cn(inputCls, 'pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {loading ? <><Spinner size="sm" /> Creating…</> : 'Create Admin Account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Placeholder for future settings sections */}
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-400 font-medium">More settings coming soon…</p>
        </div>
      </div>
    </div>
  );
}