import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie,
} from 'recharts';
import { Users, Activity, HeartPulse, Calendar } from 'lucide-react';

interface DashboardStats {
  totalUsers: number; doctors: number; patients: number; sessions: number; pendingWithdraw: number;
}
interface TherapyData { total: number; completed: number; cancelled: number; successRate: number; }

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodTrend, setMoodTrend] = useState<{ date: string; avgMood: number }[]>([]);
  const [stressData, setStressData] = useState<{ date: string; avgStress: number }[]>([]);
  const [therapy, setTherapy] = useState<TherapyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, mRes, sRes, tRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics/mood-trend?days=30').catch(() => ({ data: [] })),
          api.get('/admin/analytics/stress').catch(() => ({ data: [] })),
          api.get('/admin/analytics/therapy-success').catch(() => ({ data: null })),
        ]);
        if (dRes.data) setStats({ totalUsers: dRes.data.totalUsers||0, doctors: dRes.data.doctors||0, patients: dRes.data.patients||0, sessions: dRes.data.sessions||0, pendingWithdraw: dRes.data.pendingWithdraw||0 });
        setMoodTrend(Array.isArray(mRes.data) ? mRes.data : []);
        setStressData(Array.isArray(sRes.data) ? sRes.data : []);
        if (tRes.data) setTherapy(tRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Active Patients', value: stats?.patients || 0, icon: HeartPulse, gradient: 'from-rose-500 to-rose-600' },
    { title: 'Doctors', value: stats?.doctors || 0, icon: Activity, gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'Sessions', value: stats?.sessions || 0, icon: Calendar, gradient: 'from-purple-500 to-purple-600' },
  ];

  const overviewData = stats ? [
    { name: 'Users', count: stats.totalUsers, color: '#3b82f6' },
    { name: 'Patients', count: stats.patients, color: '#f43f5e' },
    { name: 'Doctors', count: stats.doctors, color: '#10b981' },
    { name: 'Sessions', count: stats.sessions, color: '#8b5cf6' },
  ] : [];

  const therapyPie = therapy ? [
    { name: 'Completed', value: therapy.completed || 0, color: '#22c55e' },
    { name: 'Cancelled', value: therapy.cancelled || 0, color: '#ef4444' },
    { name: 'Ongoing', value: Math.max(0, (therapy.total||0) - (therapy.completed||0) - (therapy.cancelled||0)), color: '#e2e8f0' },
  ].filter(d => d.value > 0) : [];

  const fmtDate = (v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; };

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-72 bg-gray-200 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Monitor key metrics and platform analytics.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => (
          <div key={card.title} className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{card.value.toLocaleString()}</p>
              </div>
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-60`} />
          </div>
        ))}
      </div>

      {/* Row 1: Platform Overview + Therapy Success */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-6">Platform Overview</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0/0.08)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={44} animationDuration={1200}>
                  {overviewData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Therapy Success</h3>
          {therapy ? (
            <div className="flex flex-col items-center">
              <div className="h-[170px] w-full">
                {therapyPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={therapyPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                        {therapyPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No session data yet</div>
                )}
              </div>
              <p className="text-3xl font-black text-emerald-600 mt-2">{therapy.successRate ?? 0}%</p>
              <p className="text-xs text-gray-500">Success Rate</p>
              <div className="w-full grid grid-cols-3 gap-2 mt-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-gray-900">{therapy.total}</p><p className="text-[10px] text-gray-500">Total</p></div>
                <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-green-600">{therapy.completed}</p><p className="text-[10px] text-green-600">Done</p></div>
                <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-red-600">{therapy.cancelled}</p><p className="text-[10px] text-red-600">Cancelled</p></div>
              </div>
            </div>
          ) : <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      {/* Row 2: Mood Trend + Stress Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Mood Trend</h3>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          {moodTrend.length > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-rose-500">{(moodTrend.reduce((a,b)=>a+b.avgMood,0)/moodTrend.length).toFixed(1)}</span>
                <span className="text-sm text-gray-400">avg mood across {moodTrend.length} entries</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0/0.08)' }} labelFormatter={(v: any) => new Date(String(v)).toLocaleDateString()} />
                    <Area type="monotone" dataKey="avgMood" stroke="#f43f5e" strokeWidth={2.5} fill="url(#moodFill)" dot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center">
              <span className="text-5xl mb-3">😐</span>
              <p className="text-gray-400 text-sm">No mood data recorded yet</p>
            </div>
          )}
        </div>

        {/* Stress Levels */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Stress Levels</h3>
          {stressData.length > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-violet-500">{(stressData.reduce((a,b)=>a+b.avgStress,0)/stressData.length).toFixed(1)}</span>
                <span className="text-sm text-gray-400">avg stress across {stressData.length} entries</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0/0.08)' }} labelFormatter={(v: any) => new Date(String(v)).toLocaleDateString()} />
                    <Bar dataKey="avgStress" radius={[8, 8, 0, 0]} barSize={40} animationDuration={1200}>
                      {stressData.map((_e, i) => <Cell key={i} fill={i % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center">
              <span className="text-5xl mb-3">🧘</span>
              <p className="text-gray-400 text-sm">No stress data recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
