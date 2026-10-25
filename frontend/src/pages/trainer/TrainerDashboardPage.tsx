import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerPortalApi } from '../../api/trainerPortalApi';
import {
  Calendar,
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Dumbbell,
  MapPin,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const TrainerDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: trainerPortalApi.getDashboard,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      trainerPortalApi.updateSessionStatus(sessionId, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainer-dashboard'] });
      setActionMessage(`Session marked as ${variables.status}`);
      setTimeout(() => setActionMessage(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="text-sm text-gray-500">Loading your trainer dashboard...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="text-base font-semibold text-red-800">Failed to load dashboard</h3>
        <p className="text-sm text-red-600 mt-1">
          {(error as any)?.message || 'Could not connect to trainer portal.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { trainer, stats, todaySessions, upcomingSessions, availabilitySlots } = data;

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trainer Profile Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Certified Trainer
            </span>
            {trainer.branch && (
              <span className="text-xs font-medium bg-black/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {trainer.branch.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {trainer.firstName} {trainer.lastName}!
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            {trainer.bio || `${trainer.experienceYears} years of coaching experience.`}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {trainer.specialization.map((spec) => (
              <span
                key={spec}
                className="text-xs bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-md font-medium text-emerald-50 border border-white/10"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20 backdrop-blur-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Today's Sessions
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.todaySessionsCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Scheduled for today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Active Clients
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.activeClientsCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Trained members</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Completed This Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Completed (MTD)
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.completedSessionsMtd}
            </p>
            <p className="text-xs text-gray-400 mt-1">Sessions finished</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Weekly Working Slots */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Weekly Slots
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.weeklySlotsCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Availability shifts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Upcoming Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Sessions & Action Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Today's Appointments</h2>
                <p className="text-xs text-gray-500">Live roster for today</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                {todaySessions.length} Scheduled
              </span>
            </div>

            <div className="p-5">
              {todaySessions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">No sessions scheduled for today</p>
                  <p className="text-xs text-gray-400 mt-1">Enjoy your rest day or check upcoming bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {session.member
                                ? `${session.member.firstName} ${session.member.lastName}`
                                : 'Member Session'}
                            </h3>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                session.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : session.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {session.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {session.startTime} - {session.endTime} • {session.sessionType}
                          </p>

                          {session.notes && (
                            <p className="text-xs text-gray-600 italic mt-1 bg-white px-2 py-1 rounded border border-gray-100">
                              "{session.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {session.status === 'scheduled' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                sessionId: session._id,
                                status: 'completed',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete
                          </button>
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                sessionId: session._id,
                                status: 'cancelled',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Upcoming Schedule (Next 7 Days)</h2>
              <p className="text-xs text-gray-500">Confirmed upcoming appointments</p>
            </div>

            <div className="divide-y divide-gray-100">
              {upcomingSessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No upcoming sessions found for the next 7 days.
                </div>
              ) : (
                upcomingSessions.slice(0, 5).map((session) => (
                  <div key={session._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-14 shrink-0 bg-gray-100 rounded-lg p-1.5">
                        <span className="block text-[10px] font-bold uppercase text-gray-500">
                          {session.sessionDate.slice(5)}
                        </span>
                        <span className="block text-xs font-extrabold text-gray-900">
                          {session.startTime}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {session.member
                            ? `${session.member.firstName} ${session.member.lastName}`
                            : 'Client Appointment'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.sessionType} • {session.startTime} - {session.endTime}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Confirmed
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Weekly Availability & Contact Info */}
        <div className="space-y-6">
          {/* Availability Shifts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Weekly Shifts</h2>
                <p className="text-xs text-gray-500">Operating facility hours</p>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            <div className="p-5">
              {availabilitySlots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recurring shifts configured yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {availabilitySlots.map((slot) => (
                    <div
                      key={slot._id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                    >
                      <span className="font-semibold text-gray-800">{slot.dayOfWeek}</span>
                      <span className="text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trainer Contact Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-3">Trainer Profile Information</h2>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{trainer.phone}</span>
              </div>
              {trainer.branch && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{trainer.branch.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
