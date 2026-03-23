import { useEffect, useState } from 'react';
import api from '../services/api';
import { X, CheckCircle, AlertCircle, Calendar, User as UserIcon, Shield, ShieldX, Activity, Moon, Zap, Target } from 'lucide-react';
import type { User } from '../pages/Users';

interface UserDetailsProps {
  userId: string;
  onClose: () => void;
}

export default function UserDetails({ userId, onClose }: UserDetailsProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await api.get(`/admin/users/${userId}`);
        setUserData(response.data);
      } catch (err) {
        console.error('Failed to fetch user details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 font-medium text-center">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const assessment = userData.assessmentDocs || {};
  const scores = [
    { label: 'Composite', value: assessment.compositeScore, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Mood', value: assessment.moodScore, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sleep', value: assessment.sleepScore, icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Coping', value: assessment.copingScore, icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Goal', value: assessment.goalScore, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-primary-600">
          <div className="flex items-center space-x-4 text-white">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{userData.username || 'User Details'}</h3>
              <p className="text-primary-100 text-sm">{userData.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {scores.map((score, idx) => (
              <div key={idx} className={`${score.bg} rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1`}>
                <score.icon className={`h-5 w-5 ${score.color}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{score.label}</span>
                <span className={`text-xl font-bold ${score.color}`}>{score.value ?? 'N/A'}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wellness Profile */}
            <div className="space-y-4">
              <h4 className="flex items-center text-lg font-bold text-gray-900">
                <Activity className="mr-2 h-5 w-5 text-primary-600" />
                Wellness Profile
              </h4>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-500 block mb-1">Focus Area</span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    {userData.wellnessProfile?.focusArea || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 block mb-1">Identified Issues</span>
                  <div className="flex flex-wrap gap-2">
                    {userData.wellnessProfile?.issues?.length > 0 ? (
                      userData.wellnessProfile.issues.map((issue: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md text-xs font-medium">
                          {issue}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">No specific issues identified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="flex items-center text-lg font-bold text-gray-900">
                <Shield className="mr-2 h-5 w-5 text-primary-600" />
                Account Details
              </h4>
              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3 shadow-sm text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-mono text-gray-700">{userData._id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Registered On</span>
                  <span className="text-gray-700 flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                    {new Date(userData.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Status</span>
                  {userData.blocked ? (
                    <span className="flex items-center text-red-600 font-bold uppercase text-[10px] tracking-widest">
                      <ShieldX className="h-3 w-3 mr-1" /> BLOCKED
                    </span>
                  ) : (
                    <span className="flex items-center text-emerald-600 font-bold uppercase text-[10px] tracking-widest">
                      <CheckCircle className="h-3 w-3 mr-1" /> ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Answers */}
          <div className="space-y-4">
            <h4 className="flex items-center text-lg font-bold text-gray-900">
              <Activity className="mr-2 h-5 w-5 text-primary-600" />
              Recent Assessment
            </h4>
            <div className="space-y-4">
              {assessment.answers?.length > 0 ? (
                assessment.answers.map((answer: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-900 font-semibold mb-3 flex items-start">
                      <span className="mr-3 bg-primary-100 text-primary-700 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      {answer.questionText}
                    </p>
                    <div className="ml-9 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{answer.selectedOptionText}</span>
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        Score: {answer.score}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No assessment data available for this user.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
