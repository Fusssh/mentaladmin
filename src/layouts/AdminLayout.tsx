import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu, Stethoscope, HeartPulse, Calendar, DollarSign, BarChart3, BookOpen, Video, Lock, ClipboardList } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Doctors', path: '/doctors', icon: Stethoscope },
    { name: 'Patients', path: '/patients', icon: HeartPulse },
    { name: 'Sessions', path: '/sessions', icon: Calendar },
    { name: 'Finance', path: '/finance', icon: DollarSign },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Quizzes', path: '/quizzes', icon: ClipboardList },
    { name: 'Webinars', path: '/webinars', icon: Video },
    { name: 'Settings', path: '/settings', icon: Lock },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-gray-900/50 transition-opacity lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-sky-600">
          <h1 className="text-xl font-bold text-white tracking-wide">Mental Admin</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map(item => (
              <NavLink key={item.name} to={item.path} end={item.path === '/'}
                className={({ isActive }) => cn("flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200", isActive ? "bg-sky-50 text-sky-700 shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
                <item.icon className="mr-3 h-5 w-5" />{item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"><LogOut className="mr-3 h-5 w-5" />Sign Out</button>
        </div>
      </aside>
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between px-4 bg-white border-b border-gray-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none rounded-md p-1"><Menu className="h-6 w-6" /></button>
          <h1 className="text-xl font-bold text-sky-600">Mental Admin</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8"><div className="max-w-7xl mx-auto"><Outlet /></div></main>
      </div>
    </div>
  );
}
