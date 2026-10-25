import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import {
  LogOut,
  User as UserIcon,
  Shield,
  Dumbbell,
  Sun,
  Moon,
  Bell,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/notifications');
    } else if (user?.role === 'member') {
      navigate('/member/notifications');
    } else {
      navigate('/trainer/dashboard');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gym-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">
            GYM<span className="text-gym-600">360</span>
          </span>
        </Link>

        {/* Unified Database Indicator for Administrator */}
        {user?.role === 'admin' && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-gym-200 dark:border-gym-800 bg-gym-50 dark:bg-gym-950/60 text-gym-700 dark:text-gym-400 shadow-xs ml-2">
            <Globe className="w-3.5 h-3.5 text-gym-600" />
            <span>Complete Database View (All 66 Members & 696 Entries)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notification Bell Icon */}
        <button
          type="button"
          onClick={handleNotificationClick}
          title="Notifications"
          className="relative p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gym-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gym-600" />
          </span>
        </button>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center justify-end gap-1">
                {user.role === 'admin' ? (
                  <Shield className="w-3 h-3 text-gym-600" />
                ) : (
                  <UserIcon className="w-3 h-3 text-blue-600" />
                )}
                {user.role}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Sign out of GYM360"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
