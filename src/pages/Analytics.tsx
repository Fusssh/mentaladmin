import { useEffect, useState } from 'react';
import { analyticsService } from '../services/analytics.service';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

interface TherapySuccess { total: number; completed: number; cancelled: number; successRate: number; }

// ─── Shared tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, valueLabel }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl text-sm">
      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-black text-base" style={{ color: p.stroke || p.fill }}>
          {p.value}{valueLabel ? ` ${valueLabel}` : ''}
        </p>
      ))}
    </div>
  );
};

// ─── Big KPI number ───────────────────────────────────────────────────────────

function KpiPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className={cn('text-4xl font-black tabular-nums', color)}>{value}</span>
      <span className="text-xs text-slate-400 font-medium mt-0.5">{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-1 h-5 rounded-full bg-indigo-500 shrink-0" />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{children}</h3>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [moodTrend, setMoodTrend] = useState<{ date: string; avgMood: number }[]>([]);
  const [stressData, setStressData] = useState<{ date: string; avgStress: number }[]>([]);
  const [therapy, setTherapy] = useState<TherapySuccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, s, t] = await Promise.all([
          analyticsService.getMoodTrend(),
          analyticsService.getStressLevels(),
          analyticsService.getTherapySuccess(),
        ]);
        setMoodTrend(Array.isArray(m) ? m : []);
        setStressData(Array.isArray(s) ? s : []);
        setTherapy(t);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-9 bg-slate-100 rounded-xl w-40" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map(i => <div key={i} className="h-80 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="h-80 bg-slate-100 rounded-2xl" />
    </div>
  );

  const fmtDate = (v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; };

  const avgMood = moodTrend.length ? (moodTrend.reduce((a, b) => a + b.avgMood, 0) / moodTrend.length).toFixed(1) : '—';
  const avgStress = stressData.length ? (stressData.reduce((a, b) => a + b.avgStress, 0) / stressData.length).toFixed(1) : '—';
  const maxStress = stressData.length ? Math.max(...stressData.map(d => d.avgStress)) : 0;

  const tBars = therapy ? [
    { name: 'Total', value: therapy.total, color: '#6366f1' },
    { name: 'Completed', value: therapy.completed, color: '#22c55e' },
    { name: 'Cancelled', value: therapy.cancelled, color: '#f43f5e' },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Insights</p>
        <h2 className="text-3xl font-black text-slate-900">Analytics</h2>
        <p className="text-slate-400 mt-1 text-sm">Platform-wide mood, stress, and therapy trends.</p>
      </div>

      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood', value: avgMood, color: 'text-rose-500', bg: 'bg-rose-50', badge: '/ 5 scale' },
          { label: 'Avg Stress', value: avgStress, color: 'text-violet-600', bg: 'bg-violet-50', badge: 'Index' },
          { label: 'Therapy Total', value: therapy?.total ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'Sessions' },
          { label: 'Success Rate', value: `${therapy?.successRate ?? 0}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'Completion' },
        ].map(k => (
          <div key={k.label} className={cn('rounded-2xl p-5', k.bg)}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{k.label}</p>
            <p className={cn('text-3xl font-black tabular-nums', k.color)}>{k.value}</p>
            <Badge className="mt-2 bg-white/70 text-slate-500 border-none text-[10px] font-bold px-2">{k.badge}</Badge>
          </div>
        ))}
      </div>

      {/* ── Mood + Stress charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Mood */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-0 pt-6 px-6">
            <SectionTitle>Mood Trend — last 30 days</SectionTitle>
            <div className="flex items-baseline gap-3 mb-4">
              <KpiPill value={avgMood} label={`avg across ${moodTrend.length} entries`} color="text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-6">
            {moodTrend.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip valueLabel="/ 5" />} />
                    <Area type="monotone" dataKey="avgMood" stroke="#f43f5e" strokeWidth={2.5} fill="url(#moodG)"
                      dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1400} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart emoji="😐" label="No mood data recorded" />}
          </CardContent>
        </Card>

        {/* Stress */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-0 pt-6 px-6">
            <SectionTitle>Stress Levels</SectionTitle>
            <div className="flex items-baseline gap-3 mb-4">
              <KpiPill value={avgStress} label={`avg · peak ${maxStress.toFixed(1)}`} color="text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-6">
            {stressData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stressData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stressG" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#c4b5fd" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtDate} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="avgStress" stroke="url(#stressG)" strokeWidth={3}
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1400} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart emoji="🧘" label="No stress data recorded" />}
          </CardContent>
        </Card>
      </div>

      {/* ── Therapy row ── */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pt-6 px-6 pb-0">
          <SectionTitle>Therapy Session Breakdown</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">

            {/* Bar chart */}
            <div className="md:col-span-3 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tBars} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={60} animationDuration={1200}>
                    {tBars.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* KPI panel */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="text-center py-6 rounded-2xl bg-emerald-50">
                <p className="text-6xl font-black text-emerald-600">{therapy?.successRate ?? 0}%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Overall Success Rate</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: therapy?.total, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                  { label: 'Done', value: therapy?.completed, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: 'Cancelled', value: therapy?.cancelled, bg: 'bg-rose-50', text: 'text-rose-500' },
                ].map(s => (
                  <div key={s.label} className={cn('rounded-xl p-3 text-center', s.bg)}>
                    <p className={cn('text-xl font-black', s.text)}>{s.value ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <p className="text-sm text-slate-300 font-medium">{label}</p>
    </div>
  );
}