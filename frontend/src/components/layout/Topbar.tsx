import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { Menu, Bell, ShieldCheck, ChevronDown, LogOut, User } from 'lucide-react';

export interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left section: Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right section: Quick role switcher, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors border border-purple-200/60 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Role:</span>
            <span className="uppercase font-bold">{user?.role}</span>
            <ChevronDown className="w-3 h-3 text-purple-500" />
          </button>

          {showRoleSwitcher && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
              onClick={() => setShowRoleSwitcher(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                Switch Portal Role
              </div>
              <button
                onClick={() => quickSwitchRole('PARENT')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Parent Portal</span>
                {user?.role === 'PARENT' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
              </button>
              <button
                onClick={() => quickSwitchRole('THERAPIST')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Therapist Portal</span>
                {user?.role === 'THERAPIST' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
              </button>
              <button
                onClick={() => quickSwitchRole('ADMIN')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Admin Portal</span>
                {user?.role === 'ADMIN' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-full text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User Profile Dropdown & Logout */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-100 hover:opacity-80 cursor-pointer"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-purple-200 ring-2 ring-purple-50"
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800">
              {user?.name || 'Priya'}
            </span>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
              onClick={() => setShowUserMenu(false)}
            >
              <button
                onClick={() => navigate(`/${user?.role.toLowerCase()}/profile`)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Profile Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 pt-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
