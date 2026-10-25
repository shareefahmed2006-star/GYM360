import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  CreditCard,
  DollarSign,
  CalendarCheck,
  UserCheck,
  Dumbbell,
  Wrench,
  Bell,
  BarChart3,
  ShieldAlert,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Organization', path: '/admin/organization', icon: Building2 },
    { label: 'Branches', path: '/admin/branches', icon: GitBranch },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Membership Plans', path: '/admin/plans', icon: CreditCard },
    { label: 'Subscriptions', path: '/admin/memberships', icon: CreditCard },
    { label: 'Payments', path: '/admin/payments', icon: DollarSign },
    { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { label: 'Trainers', path: '/admin/trainers', icon: UserCheck },
    { label: 'Equipment', path: '/admin/equipment', icon: Dumbbell },
    { label: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Export Data (CSV)', path: '/admin/export', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 z-20 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col`}
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between md:hidden">
            <span className="font-bold text-gray-800 dark:text-gray-100">Admin Navigation</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Operations & Facility
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gym-50 dark:bg-gym-950/60 text-gym-700 dark:text-gym-400 font-semibold shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 text-center">
            GYM360 Enterprise v1.0
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
