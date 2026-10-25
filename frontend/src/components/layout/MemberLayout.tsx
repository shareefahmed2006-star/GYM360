import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, QrCode, Dumbbell, Calendar, Bell } from 'lucide-react';
import { Header } from './Header';

export const MemberLayout: React.FC = () => {
  const memberNav = [
    { label: 'My Dashboard', path: '/member/dashboard', icon: LayoutDashboard },
    { label: 'Check-In / QR', path: '/member/check-in', icon: QrCode },
    { label: 'My Workouts', path: '/member/workouts', icon: Dumbbell },
    { label: 'Trainer Sessions', path: '/member/sessions', icon: Calendar },
    { label: 'Notifications', path: '/member/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pb-16 md:pb-0 transition-colors">
      <Header />

      {/* Top Navbar for Desktop */}
      <nav className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 gap-6">
        {memberNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-gym-600 text-gym-700 dark:text-gym-400 font-semibold'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-20">
        {memberNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors ${
                  isActive ? 'text-gym-600 dark:text-gym-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
