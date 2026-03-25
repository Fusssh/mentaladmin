import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, LogOut, Menu, Stethoscope, HeartPulse,
  Calendar, BarChart3, BookOpen, Video, Lock,
  ClipboardList, X, Sparkles,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'main' },
  { name: 'Users', path: '/users', icon: Users, group: 'main' },
  { name: 'Doctors', path: '/doctors', icon: Stethoscope, group: 'main' },
  { name: 'Patients', path: '/patients', icon: HeartPulse, group: 'main' },
  { name: 'Sessions', path: '/sessions', icon: Calendar, group: 'clinical' },
  { name: 'Webinars', path: '/webinars', icon: Video, group: 'clinical' },
  { name: 'Resources', path: '/resources', icon: BookOpen, group: 'content' },
  { name: 'Quizzes', path: '/quizzes', icon: ClipboardList, group: 'content' },
  // { name: 'Finance', path: '/finance', icon: DollarSign, group: 'ops' },
  { name: 'Analytics', path: '/analytics', icon: BarChart3, group: 'ops' },
  { name: 'Settings', path: '/settings', icon: Lock, group: 'ops' },
];

const groups: Record<string, string> = {
  main: 'Platform',
  clinical: 'Clinical',
  content: 'Content',
  ops: 'Operations',
};

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const grouped = Object.entries(groups).map(([key, label]) => ({
    label,
    items: navItems.filter(n => n.group === key),
  }));

  return (
    <>
      <style>{`
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .nav-item-hover:hover {
          background: rgba(129, 140, 248, 0.12);
          color: rgba(199, 210, 254, 0.9);
          border-color: rgba(129, 140, 248, 0.2);
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.2);
        }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-indigo-50/60">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: 'rgba(15,10,60,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-60 flex flex-col no-scrollbar',
            'transform transition-transform duration-300 ease-in-out',
            'lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          style={{
            background: 'linear-gradient(175deg, #1e1b4b 0%, #2d2b6b 45%, #1a3152 100%)',
            boxShadow: '6px 0 30px rgba(30,27,75,0.22)',
          }}
        >
          {/* ── Brand ── */}
          <div
            className="flex items-center justify-between h-16 px-5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.5)',
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-[15px] leading-none tracking-tight">MentalHealth</p>
                <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Nav ── */}
          <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-5 space-y-6">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.25em] px-3 mb-2"
                  style={{ color: 'rgba(167,139,250,0.4)' }}
                >
                  {label}
                </p>
                <div className="space-y-0.5">
                  {items.map(item => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {({ isActive }) => (
                        <div
                          className={cn(
                            'nav-item-hover flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
                            'border',
                          )}
                          style={isActive ? {
                            background: 'rgba(139,92,246,0.2)',
                            color: '#c4b5fd',
                            borderColor: 'rgba(139,92,246,0.35)',
                          } : {
                            color: 'rgba(196,181,253,0.45)',
                            borderColor: 'transparent',
                          }}
                        >
                          <item.icon
                            className="w-4 h-4 shrink-0"
                            style={{ color: isActive ? '#a78bfa' : 'rgba(167,139,250,0.35)' }}
                          />
                          <span className="flex-1">{item.name}</span>
                          {isActive && (
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: '#a78bfa' }}
                            />
                          )}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* ── Footer ── */}
          <div
            className="p-3 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={handleLogout}
              className="logout-btn flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all border"
              style={{ color: 'rgba(252,165,165,0.6)', borderColor: 'transparent' }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <div className="flex flex-col flex-1 w-0 overflow-hidden">

          {/* Mobile topbar */}
          <header
            className="flex h-16 items-center justify-between px-4 lg:hidden shrink-0 bg-white"
            style={{ borderBottom: '1px solid rgba(139,92,246,0.1)', boxShadow: '0 1px 16px rgba(139,92,246,0.08)' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: '#7c3aed' }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-slate-900">MentalHealth</span>
            </div>
            <div className="w-9" />
          </header>

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8"
            style={{ background: '#f5f3ff' }}
          >
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}