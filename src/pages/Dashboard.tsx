import { useEffect, useState } from 'react';
import { analyticsService } from '../services/analytics.service';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Users, Activity, HeartPulse, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
// import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number; doctors: number; patients: number;
  sessions: number; pendingWithdraw: number;
}
interface TherapyData {
  total: number; completed: number; cancelled: number; successRate: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl shadow-slate-200/60 text-sm">
      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string; value: number;
  icon: React.ElementType; color: string; bg: string; ring: string;
  trend?: number;
}

function StatCard({ title, value, icon: Icon, color, bg, ring, trend }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group', ring)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{title}</p>
            <p className="text-4xl font-black text-slate-900 tabular-nums">{value.toLocaleString()}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  : trend < 0
                    ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    : <Minus className="w-3.5 h-3.5 text-slate-300" />}
                <span className={cn('text-xs font-bold',
                  trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-400' : 'text-slate-300'
                )}>
                  {trend > 0 ? `+${trend}` : trend}% this week
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300', bg)}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
        </div>
        {/* bottom accent bar */}
        <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', bg.replace('bg-', 'bg-').replace('/10', ''))} />
      </CardContent>
    </Card>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-1 h-5 rounded-full bg-indigo-500 shrink-0" />
      <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">{children}</h3>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodTrend, setMoodTrend] = useState<{ date: string; avgMood: number }[]>([]);
  const [stressData, setStressData] = useState<{ date: string; avgStress: number }[]>([]);
  const [therapy, setTherapy] = useState<TherapyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dData, mData, sData, tData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getMoodTrend().catch(() => []),
          analyticsService.getStressLevels().catch(() => []),
          analyticsService.getTherapySuccess().catch(() => null),
        ]);
        if (dData) setStats({
          totalUsers: dData.totalUsers || 0, doctors: dData.doctors || 0,
          patients: dData.patients || 0, sessions: dData.sessions || 0,
          pendingWithdraw: dData.pendingWithdraw || 0,
        });
        setMoodTrend(Array.isArray(mData) ? mData : []);
        setStressData(Array.isArray(sData) ? sData : []);
        if (tData) setTherapy(tData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const fmtDate = (v: string) => {
    const d = new Date(v);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const therapyPie = therapy ? [
    { name: 'Completed', value: therapy.completed || 0, color: '#22c55e' },
    { name: 'Cancelled', value: therapy.cancelled || 0, color: '#f43f5e' },
    { name: 'Ongoing', value: Math.max(0, (therapy.total || 0) - (therapy.completed || 0) - (therapy.cancelled || 0)), color: '#e2e8f0' },
  ].filter(d => d.value > 0) : [];

  const overviewData = stats ? [
    { name: 'Users', count: stats.totalUsers, color: '#6366f1' },
    { name: 'Patients', count: stats.patients, color: '#f43f5e' },
    { name: 'Doctors', count: stats.doctors, color: '#10b981' },
    { name: 'Sessions', count: stats.sessions, color: '#8b5cf6' },
  ] : [];

  const avgMood = moodTrend.length ? (moodTrend.reduce((a, b) => a + b.avgMood, 0) / moodTrend.length).toFixed(1) : '—';
  const avgStress = stressData.length ? (stressData.reduce((a, b) => a + b.avgStress, 0) / stressData.length).toFixed(1) : '—';

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-9 bg-slate-100 rounded-xl w-56" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-2xl" />
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map(i => <div key={i} className="h-72 bg-slate-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Admin Panel</p>
          <h2 className="text-3xl font-black text-slate-900">Dashboard</h2>
          <p className="text-slate-400 mt-1 text-sm">Platform health at a glance.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1.5 text-xs font-bold self-start sm:self-end">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block animate-pulse" />
          Live Data
        </Badge>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="text-indigo-600" bg="bg-indigo-50" ring="ring-1 ring-indigo-100" />
        <StatCard title="Active Patients" value={stats?.patients || 0} icon={HeartPulse} color="text-rose-500" bg="bg-rose-50" ring="ring-1 ring-rose-100" />
        <StatCard title="Doctors" value={stats?.doctors || 0} icon={Activity} color="text-emerald-600" bg="bg-emerald-50" ring="ring-1 ring-emerald-100" />
        <StatCard title="Sessions" value={stats?.sessions || 0} icon={Calendar} color="text-violet-600" bg="bg-violet-50" ring="ring-1 ring-violet-100" />
      </div>

      {/* ── Row 2: Bar overview + Therapy donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle>Platform Overview</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData} margin={{ top: 0, right: 8, left: -24, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[10, 10, 4, 4]} maxBarSize={56} animationDuration={1000}>
                    {overviewData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Therapy donut */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle>Therapy Sessions</SectionTitle>
          </CardHeader>
          <CardContent>
            {therapy ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-[150px] w-full">
                  {therapyPie.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={therapyPie} cx="50%" cy="50%" innerRadius={46} outerRadius={65}
                            paddingAngle={4} dataKey="value" stroke="none" animationDuration={1000}>
                            {therapyPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centre label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-emerald-600">{therapy.successRate ?? 0}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 text-sm">No data</div>
                  )}
                </div>

                {/* Legend */}
                <div className="w-full grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total', value: therapy.total, color: 'bg-slate-100', text: 'text-slate-700' },
                    { label: 'Done', value: therapy.completed, color: 'bg-emerald-50', text: 'text-emerald-600' },
                    { label: 'Cancelled', value: therapy.cancelled, color: 'bg-rose-50', text: 'text-rose-500' },
                  ].map(s => (
                    <div key={s.label} className={cn('rounded-xl p-2.5 text-center', s.color)}>
                      <p className={cn('text-lg font-black', s.text)}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-300 text-sm">No therapy data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Mood + Stress charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Mood trend */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-start justify-between">
              <div>
                <SectionTitle>Mood Trend</SectionTitle>
                {moodTrend.length > 0 && (
                  <div className="flex items-baseline gap-2 -mt-2 mb-4">
                    <span className="text-4xl font-black text-rose-500">{avgMood}</span>
                    <span className="text-xs text-slate-400 font-medium">avg · {moodTrend.length} entries · 30 days</span>
                  </div>
                )}
              </div>
              <Badge className="bg-rose-50 text-rose-500 border-none text-[10px] font-bold">Mood / 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {moodTrend.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrend} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} / 5`} />} />
                    <Area type="monotone" dataKey="avgMood" stroke="#f43f5e" strokeWidth={2.5}
                      fill="url(#moodGrad)"
                      dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart emoji="😐" label="No mood data yet" />
            )}
          </CardContent>
        </Card>

        {/* Stress levels */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-start justify-between">
              <div>
                <SectionTitle>Stress Levels</SectionTitle>
                {stressData.length > 0 && (
                  <div className="flex items-baseline gap-2 -mt-2 mb-4">
                    <span className="text-4xl font-black text-violet-500">{avgStress}</span>
                    <span className="text-xs text-slate-400 font-medium">avg · {stressData.length} entries</span>
                  </div>
                )}
              </div>
              <Badge className="bg-violet-50 text-violet-500 border-none text-[10px] font-bold">Stress Index</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stressData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#faf5ff' }} />
                    <Bar dataKey="avgStress" radius={[6, 6, 2, 2]} maxBarSize={28} animationDuration={1200}>
                      {stressData.map((_e, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart emoji="🧘" label="No stress data yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <p className="text-sm text-slate-300 font-medium">{label}</p>
    </div>
  );
}