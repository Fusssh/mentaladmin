import { useEffect, useState } from 'react';
import { financeService } from '../services/finance.service';
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RevenueSummary {
  totalRevenue: number; totalWithdrawn: number; pendingWithdrawals: number; netBalance: number;
}
interface Transaction {
  _id: string; type: string; amount: number; status: string; createdAt: string; doctorId?: any;
}

export default function Finance() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (tab !== 'all') return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await financeService.getTransactions({ page, limit: 10 });
        setTransactions(data.items || (Array.isArray(data) ? data : []));
        setTotalPages(Math.ceil((data.total || 0) / 10));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [tab, page]);

  const handleApprove = async (id: string) => {
    try {
      await financeService.approveWithdrawal(id);
      setPending(p => p.filter(x => x._id !== id));
    } catch (err) { console.error(err); }
  };
  const handleReject = async (id: string) => {
    try {
      await financeService.rejectWithdrawal(id);
      setPending(p => p.filter(x => x._id !== id));
    } catch (err) { console.error(err); }
  };

  const Card = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4 hover:scale-[1.02] transition-transform">
      <div className={`p-4 rounded-xl ${color}`}><Icon className="h-6 w-6 text-white" /></div>
      <div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900">₹{(value || 0).toLocaleString()}</p></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Finance Management</h2><p className="mt-1 text-sm text-gray-500">Revenue, transactions, and withdrawal management.</p></div>
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Total Revenue" value={summary.totalRevenue} icon={DollarSign} color="bg-emerald-500" />
          <Card title="Total Withdrawn" value={summary.totalWithdrawn} icon={DollarSign} color="bg-blue-500" />
          <Card title="Pending Withdrawals" value={summary.pendingWithdrawals} icon={Clock} color="bg-amber-500" />
          <Card title="Net Balance" value={summary.netBalance} icon={DollarSign} color="bg-purple-500" />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'pending' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Pending Withdrawals ({pending.length})</button>
        <button onClick={() => { setTab('all'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'all' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All Transactions</button>
      </div>
      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        {tab === 'pending' ? (
          pending.length === 0 ? <div className="p-10 text-center text-gray-400">No pending withdrawals.</div> : (
            <div className="divide-y divide-gray-200">
              {pending.map(t => (
                <div key={t._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">₹{t.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(t._id)} className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50" title="Approve"><CheckCircle className="w-5 h-5"/></button>
                    <button onClick={() => handleReject(t._id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50" title="Reject"><XCircle className="w-5 h-5"/></button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {loading ? <div className="p-10 text-center text-gray-400">Loading…</div> : transactions.length === 0 ? <div className="p-10 text-center text-gray-400">No transactions.</div> : (
              <div className="divide-y divide-gray-200">
                {transactions.map(t => (
                  <div key={t._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">₹{t.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{t.type} · {new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t flex items-center justify-between">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
