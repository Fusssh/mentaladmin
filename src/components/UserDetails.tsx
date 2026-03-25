import { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import {
  X, CheckCircle, AlertCircle, Calendar, User as UserIcon,
  Shield, ShieldX, Activity, Moon, Zap, Target, RefreshCw,
} from 'lucide-react';
import type { User } from '../pages/Users';
import { cn } from '../lib/utils';

interface UserDetailsProps {
  userId: string;
  onClose: () => void;
}

export default function UserDetails({ userId, onClose }: UserDetailsProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await userService.getUserById(userId);
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch user details', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserDetails(); }, [userId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading user details…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !userData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Could not load user</p>
            <p className="text-sm text-slate-500 mt-1">There was a problem fetching this user's data.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={fetchUserDetails}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const assessment = userData.assessmentDocs || {};
  const wellness = userData.wellnessProfile || {};
  const answers = Array.isArray(assessment.answers) ? assessment.answers : [];

  const scores = [
    { label: 'Composite', value: assessment.compositeScore, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
    { label: 'Mood', value: assessment.moodScore, icon: Activity, color: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-200' },
    { label: 'Sleep', value: assessment.sleepScore, icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200' },
    { label: 'Coping', value: assessment.copingScore, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
    { label: 'Goal', value: assessment.goalScore, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
  ];

  const rolePill: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-emerald-100 text-emerald-700',
    patient: 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6 bg-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <UserIcon className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{userData.username || 'User Details'}</h3>
                <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', rolePill[userData.role] || 'bg-slate-100 text-slate-600')}>
                  {userData.role}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{userData.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">

          {/* Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {scores.map((s) => (
              <div key={s.label} className={cn('rounded-2xl p-4 flex flex-col items-center gap-2 text-center ring-1', s.bg, s.ring)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                <p className={cn('text-2xl font-black', s.color)}>
                  {s.value !== undefined && s.value !== null ? s.value : '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Wellness Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Wellness Profile</h4>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Focus Area</p>
                {wellness.focusArea ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wide border border-teal-100">
                    {wellness.focusArea.replace(/_/g, ' ')}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 italic">Not set</span>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Identified Issues</p>
                {wellness.issues?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {wellness.issues.map((issue: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold">
                        {issue}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No issues identified</p>
                )}
              </div>

              {wellness.suggestedSolutions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Suggested Programs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wellness.suggestedSolutions.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Account Details</h4>
              </div>
              <dl className="space-y-3">
                {[
                  { label: 'User ID', value: <span className="font-mono text-xs">{userData._id}</span> },
                  {
                    label: 'Registered', value: (
                      <span className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(userData.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </span>
                    )
                  },
                  {
                    label: 'Status', value: userData.blocked
                      ? <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase tracking-wider"><ShieldX className="w-3.5 h-3.5" /> Blocked</span>
                      : <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-wider"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                  },
                  {
                    label: 'Onboarding', value: (
                      <span className={cn('text-xs font-bold uppercase tracking-wide', userData.onboardingCompleted ? 'text-emerald-600' : 'text-amber-500')}>
                        {userData.onboardingCompleted ? 'Complete' : 'Pending'}
                      </span>
                    )
                  },
                  {
                    label: 'Verified', value: (
                      <span className={cn('text-xs font-bold uppercase tracking-wide', userData.isVerified ? 'text-emerald-600' : 'text-slate-400')}>
                        {userData.isVerified ? 'Yes' : 'No'}
                      </span>
                    )
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                    <dd className="text-sm text-slate-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Assessment Answers */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-500" />
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Assessment Answers</h4>
              {answers.length > 0 && (
                <span className="ml-auto text-xs font-bold text-slate-400">{answers.length} question{answers.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {answers.length > 0 ? (
              <div className="space-y-3">
                {answers.map((answer: any, idx: number) => (
                  <div key={answer._id || idx} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{answer.questionText}</p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <p className="text-sm text-slate-600">{answer.selectedOptionText}</p>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg">
                          Score: {answer.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-bold text-slate-900">No assessment data</p>
                <p className="text-sm text-slate-500 mt-1">This user hasn't completed an assessment yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}