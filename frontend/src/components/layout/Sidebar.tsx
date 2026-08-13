import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Baby,
  ClipboardList,
  Calendar,
  Clock,
  Activity,
  FileText,
  MessageSquare,
  User,
  LogOut,
  HeartHandshake,
  Video,
  LineChart,
  Settings
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;

  const parentNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/parent/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Screening Test', path: '/parent/assessment', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Upload Video', path: '/parent/upload-video', icon: <Video className="w-4 h-4" /> },
    { label: 'Reports', path: '/parent/results', icon: <FileText className="w-4 h-4" /> },
    { label: 'Therapists', path: '/parent/therapists', icon: <HeartHandshake className="w-4 h-4" /> },
    { label: 'Appointments', path: '/parent/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Progress', path: '/parent/progress', icon: <LineChart className="w-4 h-4" /> },
    { label: 'Messages', path: '/parent/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Profile', path: '/parent/profile', icon: <User className="w-4 h-4" /> }
  ];

  const therapistNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/therapist/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Children', path: '/therapist/children', icon: <Baby className="w-4 h-4" /> },
    { label: 'Appointments', path: '/therapist/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'My Schedule', path: '/therapist/schedule', icon: <Clock className="w-4 h-4" /> },
    { label: 'Behavior Analysis', path: '/therapist/behavior-analysis', icon: <Activity className="w-4 h-4" /> },
    { label: 'Reports', path: '/therapist/reports', icon: <FileText className="w-4 h-4" /> },
    { label: 'Messages', path: '/therapist/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Profile', path: '/therapist/profile', icon: <User className="w-4 h-4" /> }
  ];

  const adminNav: SidebarItem[] = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Users', path: '/admin/parents', icon: <Users className="w-4 h-4" /> },
    { label: 'Therapists', path: '/admin/therapists', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Appointments', path: '/admin/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Reports', path: '/admin/reports', icon: <FileText className="w-4 h-4" /> },
    { label: 'Settings', path: '/admin/system', icon: <Settings className="w-4 h-4" /> },
    { label: 'Profile', path: '/admin/profile', icon: <User className="w-4 h-4" /> }
  ];

  const items = role === 'PARENT' ? parentNav : role === 'THERAPIST' ? therapistNav : adminNav;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isItemActive = (itemPath: string) => {
    if (location.pathname === itemPath) return true;
    if (!itemPath.endsWith('/dashboard') && location.pathname.startsWith(itemPath + '/')) {
      return true;
    }
    return false;
  };

  return (
    <aside className="w-60 bg-[#111927] text-white flex flex-col h-full shrink-0 select-none shadow-xl border-r border-slate-800">
      {/* AutiCare Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
          A
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
            Auti<span className="text-purple-400">Care</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Child Development AI</p>
        </div>
      </div>

      {/* Route-Aware Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (onItemClick) onItemClick();
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-left',
                isActive
                  ? 'bg-purple-600 text-white font-extrabold shadow-md shadow-purple-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer & Logout Button */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
