import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';
import { useNotifications } from '../../hooks/useNotifications';
import { useExpiringMemberships } from '../../hooks/useMemberships';
import { RenewModal } from '../../components/membership/RenewModal';
import { useQuery } from '@tanstack/react-query';
import { memberWorkflowApi } from '../../api/memberWorkflowApi';
import {
  User,
  QrCode,
  Dumbbell,
  Calendar,
  CheckCircle2,
  Bell,
  ArrowRight,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const MemberDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Queries for live dashboard summary metrics
  const { data: attendanceResponse } = useAttendance();
  const { data: notificationResponse } = useNotifications();
  const { data: expiringList = [] } = useExpiringMemberships(30);

  const [selectedExpiringMembership, setSelectedExpiringMembership] = useState<any | null>(null);

  const { data: workouts = [] } = useQuery({
    queryKey: ['memberWorkouts'],
    queryFn: () => memberWorkflowApi.listMemberWorkouts(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['memberSessions'],
    queryFn: () => memberWorkflowApi.listMemberSessions(),
  });

  const attendanceList = attendanceResponse?.data || [];
  const openSession = attendanceList.find(
    (a) => a.status === 'present' && (!a.checkOutTime || a.checkOutTime === '')
  );

  const notifications = notificationResponse?.data || [];
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const activeWorkoutsCount = workouts.filter((w) => w.status === 'active').length;
  const upcomingSessionsCount = sessions.filter((s) => s.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" />
              Member Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Hello, {user?.firstName}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome to your personal GYM360 workout & membership hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Membership Active
            </span>

            {openSession && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 animate-pulse">
                <Clock className="w-4 h-4" />
                Currently Checked In
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expiration Alert & 1-Click Renewal Banner */}
      {expiringList.length > 0 && (
        <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-gray-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {expiringList[0].daysRemaining <= 0
                    ? 'Membership Expired'
                    : `Membership Expiring in ${expiringList[0].daysRemaining} Day${expiringList[0].daysRemaining === 1 ? '' : 's'}`}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Plan: {expiringList[0].planName}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your subscription ends on{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {expiringList[0].endDate}
                </span>
                . Renew instantly to prevent gym turnstile lockout and keep your fitness streaks!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedExpiringMembership(expiringList[0])}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click Renew Plan (₹{expiringList[0].planPrice})</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Workflow Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Check-In Card */}
        <Link
          to="/member/check-in"
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:border-gym-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gym-50 text-gym-600 flex items-center justify-center shrink-0 border border-gym-100">
                <QrCode className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  openSession
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {openSession ? 'Active Session' : 'Ready'}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mt-3">Facility Check-In</h3>
            <p className="text-xs text-gray-500 mt-1">
              {openSession
                ? `Checked in at ${openSession.checkInTime.slice(11, 16)} UTC. Click to check out.`
                : 'Scan turnstile pass for front desk access.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gym-700 group-hover:text-gym-900">
            <span>{attendanceList.length} Total Visits</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Workouts Card */}
        <Link
          to="/member/workouts"
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <Dumbbell className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200 font-mono">
                {activeWorkoutsCount} Active
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mt-3">Assigned Workouts</h3>
            <p className="text-xs text-gray-500 mt-1">
              Trainer-assigned fitness regimens and progress tracking.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-purple-700 group-hover:text-purple-900">
            <span>View Programs</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Sessions Card */}
        <Link
          to="/member/sessions"
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 font-mono">
                {upcomingSessionsCount} Upcoming
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mt-3">Trainer Coaching</h3>
            <p className="text-xs text-gray-500 mt-1">
              Schedule 1-on-1 consultations with personal coaches.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-700 group-hover:text-amber-900">
            <span>Book or Manage</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Notifications Card */}
        <Link
          to="/member/notifications"
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Bell className="w-6 h-6" />
              </div>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-200 font-mono">
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">
                  Up to Date
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base mt-3">Announcements</h3>
            <p className="text-xs text-gray-500 mt-1">
              Branch announcements, billing reminders, and alerts.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:text-blue-900">
            <span>Open Inbox</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* 1-Click Renewal Modal */}
      {selectedExpiringMembership && (
        <RenewModal
          isOpen={!!selectedExpiringMembership}
          onClose={() => setSelectedExpiringMembership(null)}
          membershipId={selectedExpiringMembership._id}
          planName={selectedExpiringMembership.planName}
          planPrice={selectedExpiringMembership.planPrice}
          currentEndDate={selectedExpiringMembership.endDate}
          durationMonths={selectedExpiringMembership.planDurationMonths}
        />
      )}
    </div>
  );
};
