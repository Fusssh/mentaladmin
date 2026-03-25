import { useEffect, useState } from 'react';
import { financeService } from '../services/finance.service';
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Wallet, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';

interface RevenueSummary {
  totalRevenue: number; totalWithdrawn: number; pendingWithdrawals: number; netBalance: number;
}
interface Transaction {
  _id: string; type: string; amount: number; status: string; createdAt: string; doctorId?: any;
}

const STATUS_CFG = {
  completed: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  pending: { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  rejected: { pill: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
} as const;

export default function Finance() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sumData, pendData] = await Promise.all([
          financeService.getSummary(),
          financeService.getWithdrawals(),
        ]);
        setSummary(sumData);
        setPending(Array.isArray(pendData) ? pendData : pendData.items || []);
      } catch {
        toast.error('Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (tab !== 'all') return;
    const load = async () => {
      setTxLoading(true);
      try {
        const data = await financeService.getTransactions({ page, limit: 10 });
        setTransactions(data.items || (Array.isArray(data) ? data : []));
        setTotalPages(Math.ceil((data.total || 0) / 10));
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setTxLoading(false);
      }
    };
    load();
  }, [tab, page]);

  const handleApprove = async (id: string) => {
    const lid = toast.loading('Approving…');
    try {
      await financeService.approveWithdrawal(id);
      setPending(p => p.filter(x => x._id !== id));
      toast.success('Withdrawal approved', { id: lid });
    } catch {
      toast.error('Failed to approve', { id: lid });
    }
  };

  const handleReject = async (id: string) => {
    const lid = toast.loading('Rejecting…');
    try {
      await financeService.rejectWithdrawal(id);
      setPending(p => p.filter(x => x._id !== id));
      toast.success('Withdrawal rejected', { id: lid });
    } catch {
      toast.error('Failed to reject', { id: lid });
    }
  };

  const fmtINR = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const statCards = [
    { label: 'Total Revenue', value: summary?.totalRevenue, icon: TrendingUp, cls: 'bg-slate-900 text-white', iconCls: 'text-teal-400' },
    { label: 'Total Withdrawn', value: summary?.totalWithdrawn, icon: ArrowDownRight, cls: 'bg-sky-50 text-sky-700', iconCls: 'text-sky-500' },
    { label: 'Pending Withdrawals', value: summary?.pendingWithdrawals, icon: Clock, cls: 'bg-amber-50 text-amber-700', iconCls: 'text-amber-500' },
    { label: 'Net Balance', value: summary?.netBalance, icon: Wallet, cls: 'bg-emerald-50 text-emerald-700', iconCls: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Finance</h2>
        <p className="text-slate-500 mt-1">Revenue tracking and withdrawal management.</p>
      </div>

      {/* ── Stats ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(s => (
            <div key={s.label} className={cn('rounded-2xl p-5 flex flex-col gap-3', s.cls)}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">{s.label}</span>
                <s.icon className={cn('w-4 h-4', s.iconCls)} />
              </div>
              <span className="text-2xl font-black">{fmtINR(s.value ?? 0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit shadow-sm">
        {(['pending', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all',
              tab === t ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {t === 'pending' ? `Pending Withdrawals${pending.length ? ` (${pending.length})` : ''}` : 'All Transactions'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

        {/* ─ Pending withdrawals ─ */}
        {tab === 'pending' && (
          pending.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="font-bold text-slate-900">All clear!</p>
              <p className="text-sm text-slate-500 mt-1">No pending withdrawal requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {pending.length} pending request{pending.length !== 1 ? 's' : ''}
                </p>
              </div>
              {pending.map(t => (
                <div key={t._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{fmtINR(t.amount)}</p>
                      <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(t._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(t._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─ All transactions ─ */}
        {tab === 'all' && (
          txLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Spinner size="lg" className="text-teal-500" />
              <p className="text-slate-400 font-medium animate-pulse">Loading transactions…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                <DollarSign className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-bold text-slate-900">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50">
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 grid grid-cols-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <span>Amount</span><span>Type</span><span>Date</span><span className="text-right">Status</span>
                </div>
                {transactions.map(t => {
                  const s = STATUS_CFG[t.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
                  return (
                    <div key={t._id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors grid grid-cols-4 items-center">
                      <p className="text-sm font-bold text-slate-900">{fmtINR(t.amount)}</p>
                      <p className="text-xs text-slate-500 capitalize">{t.type}</p>
                      <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                      <div className="flex justify-end">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', s.pill)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Page <span className="font-bold text-slate-700">{page}</span> of <span className="font-bold text-slate-700">{totalPages}</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all">Previous</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all">Next</button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}