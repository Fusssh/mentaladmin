import { useEffect, useState } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface TherapySuccess { total: number; completed: number; cancelled: number; successRate: number; }

export default function Analytics() {
  const [moodTrend, setMoodTrend] = useState<{date:string;avgMood:number}[]>([]);
  const [stressData, setStressData] = useState<{date:string;avgStress:number}[]>([]);
  const [therapy, setTherapy] = useState<TherapySuccess|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m,s,t] = await Promise.all([
          api.get('/admin/analytics/mood-trend?days=30'),
          api.get('/admin/analytics/stress'),
          api.get('/admin/analytics/therapy-success'),
        ]);
        setMoodTrend(Array.isArray(m.data)?m.data:[]);
        setStressData(Array.isArray(s.data)?s.data:[]);
        setTherapy(t.data);
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    load();
  }, []);

  if(loading) return <div className="animate-pulse space-y-8"><div className="h-8 bg-gray-200 rounded w-1/4"/><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2].map(i=><div key={i} className="h-80 bg-gray-200 rounded-2xl"/>)}</div></div>;

  const tData = therapy?[{name:'Total',value:therapy.total,color:'#6366f1'},{name:'Completed',value:therapy.completed,color:'#22c55e'},{name:'Cancelled',value:therapy.cancelled,color:'#ef4444'}]:[];

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold text-gray-900">Analytics</h2><p className="mt-1 text-sm text-gray-500">Platform-wide mood, stress, and therapy trends.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Mood Trend (30d)</h3>
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={moodTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:11}}/><YAxis domain={[0,5]} axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:11}}/><Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 6px -1px rgb(0 0 0/0.1)'}}/><Line type="monotone" dataKey="avgMood" stroke="#f43f5e" strokeWidth={3} dot={{fill:'#f43f5e',r:4}} animationDuration={1500}/></LineChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Stress Levels</h3>
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={stressData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:11}}/><Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 6px -1px rgb(0 0 0/0.1)'}}/><Line type="monotone" dataKey="avgStress" stroke="#8b5cf6" strokeWidth={3} dot={{fill:'#8b5cf6',r:4}} animationDuration={1500}/></LineChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Therapy Success Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={tData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280',fontSize:12}}/><Tooltip/><Bar dataKey="value" radius={[8,8,0,0]} animationDuration={1500}>{tData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
          <div className="flex flex-col justify-center space-y-6">
            <div className="text-center"><p className="text-5xl font-black text-indigo-600">{therapy?.successRate??0}%</p><p className="text-sm text-gray-500 mt-1">Overall Success Rate</p></div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xl font-bold text-indigo-600">{therapy?.total}</p><p className="text-xs text-gray-500">Total</p></div>
              <div className="bg-green-50 rounded-xl p-3"><p className="text-xl font-bold text-green-600">{therapy?.completed}</p><p className="text-xs text-gray-500">Done</p></div>
              <div className="bg-red-50 rounded-xl p-3"><p className="text-xl font-bold text-red-600">{therapy?.cancelled}</p><p className="text-xs text-gray-500">Cancelled</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
