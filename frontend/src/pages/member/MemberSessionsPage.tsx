import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberWorkflowApi } from '../../api/memberWorkflowApi';
import { useTrainers } from '../../hooks/useTrainers';
import { useBranches } from '../../hooks/useBranches';
import { trainerApi } from '../../api/trainerApi';
import { TrainerAvailabilityDocument } from '../../types/trainer.types';
import {
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  Sparkles,
} from 'lucide-react';

export const MemberSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['memberSessions'],
    queryFn: () => memberWorkflowApi.listMemberSessions(),
  });

  const { data: trainers = [] } = useTrainers({ status: 'active' });
  const { data: branches = [] } = useBranches();

  // UI States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Booking Form State
  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(todayUtc);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [sessionType, setSessionType] = useState<string>('Personal Training');
  const [notes, setNotes] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Availability state for selected trainer
  const [trainerSlots, setTrainerSlots] = useState<TrainerAvailabilityDocument[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Mapping lookups
  const trainerMap = useMemo(() => {
    return new Map(trainers.map((t) => [t._id, `${t.firstName} ${t.lastName}`]));
  }, [trainers]);

  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Load availability when selected trainer changes
  const handleTrainerChange = async (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setBookingError(null);
    if (!trainerId) {
      setTrainerSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    try {
      const slots = await trainerApi.listAvailability(trainerId);
      setTrainerSlots(slots.filter((s) => s.status === 'available'));
    } catch {
      setTrainerSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Cancel Session Mutation
  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) =>
      memberWorkflowApi.cancelTrainerSession(sessionId),
    onSuccess: () => {
      setActionSuccess('Training appointment cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['memberSessions'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to cancel session.');
    },
  });

  // Book Session Mutation
  const bookMutation = useMutation({
    mutationFn: () => {
      if (!selectedTrainerId) throw new Error('Please select a trainer.');
      if (sessionDate < todayUtc) throw new Error('Cannot book sessions on a past date.');
      if (startTime >= endTime) throw new Error('End time must be later than start time.');
      if (!sessionType.trim()) throw new Error('Session type is required.');

      return memberWorkflowApi.bookTrainerSession({
        trainerId: selectedTrainerId,
        sessionDate,
        startTime,
        endTime,
        sessionType: sessionType.trim(),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setActionSuccess('Session booked successfully! Your trainer will see your appointment.');
      setIsBookingModalOpen(false);
      // Reset form
      setSelectedTrainerId('');
      setNotes('');
      setBookingError(null);
      queryClient.invalidateQueries({ queryKey: ['memberSessions'] });
    },
    onError: (err: any) => {
      setBookingError(err.message || 'Failed to book session. Check trainer schedule or branch access.');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200 line-through';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
            <Calendar className="w-4 h-4" />
            Personal Coaching & Consultation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Trainer Appointments
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Schedule 1-on-1 personal coaching sessions and manage your training consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            {isFetching ? 'Syncing...' : 'Sync'}
          </button>

          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setActionSuccess(null);
              setBookingError(null);
              setIsBookingModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Book Training Session
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="font-bold underline text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-bold underline text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              My Scheduled & Historical Sessions
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Appointments with your certified personal trainers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
            {sessions.length} Bookings
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-700">
            Failed to load trainer sessions.
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">No Training Appointments Yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Ready to take your workouts to the next level? Book a personalized session with one of our trainers!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Session Type</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => {
                  const isScheduled = session.status === 'scheduled';
                  const trainerName = trainerMap.get(session.trainerId) || 'Trainer ' + session.trainerId.slice(-6);
                  const branchName = branchMap.get(session.branchId) || 'Branch ' + session.branchId.slice(-6);

                  return (
                    <tr key={session._id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                        {session.sessionDate}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">
                        {session.startTime} - {session.endTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                        {trainerName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {branchName}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        <span className="font-medium">{session.sessionType}</span>
                        {session.notes && (
                          <span className="text-[11px] text-gray-400 block truncate max-w-xs">
                            {session.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(
                            session.status
                          )}`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isScheduled && (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(session._id)}
                            disabled={cancelMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Session Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden my-8">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Book Training Session</h3>
                  <p className="text-[11px] text-gray-500">Choose a trainer, date, and available time slot.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-50 border-b border-red-100 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Trainer Select */}
              <div className="space-y-1">
                <label htmlFor="trainer-select" className="font-semibold text-gray-700 block">
                  Select Certified Trainer *
                </label>
                <select
                  id="trainer-select"
                  value={selectedTrainerId}
                  onChange={(e) => handleTrainerChange(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Choose a Trainer --</option>
                  {trainers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.firstName} {t.lastName} ({t.specialization?.join(', ') || 'General Fitness'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Working Hours Display */}
              {selectedTrainerId && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    Trainer Weekly Available Windows
                  </span>
                  {isLoadingSlots ? (
                    <div className="text-gray-400 italic">Checking schedule...</div>
                  ) : trainerSlots.length === 0 ? (
                    <div className="text-amber-700 italic">No recurring availability slots configured for this trainer.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {trainerSlots.map((s) => (
                        <span
                          key={s._id}
                          className="px-2 py-0.5 rounded bg-white border border-gray-200 font-mono text-[10px] text-gray-700"
                        >
                          {s.dayOfWeek.slice(0, 3)}: {s.startTime}–{s.endTime}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-1">
                <label htmlFor="date-input" className="font-semibold text-gray-700 block">
                  Session Date *
                </label>
                <input
                  id="date-input"
                  type="date"
                  min={todayUtc}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="start-time-input" className="font-semibold text-gray-700 block">
                    Start Time (24h) *
                  </label>
                  <input
                    id="start-time-input"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="end-time-input" className="font-semibold text-gray-700 block">
                    End Time (24h) *
                  </label>
                  <input
                    id="end-time-input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Session Type */}
              <div className="space-y-1">
                <label htmlFor="type-select" className="font-semibold text-gray-700 block">
                  Session Focus / Consultation Type *
                </label>
                <select
                  id="type-select"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Personal Training">Personal Training (1-on-1)</option>
                  <option value="Strength & Conditioning">Strength & Conditioning</option>
                  <option value="Cardio & Endurance">Cardio & Endurance</option>
                  <option value="Mobility & Rehab">Mobility & Rehab</option>
                  <option value="Nutrition Consultation">Nutrition Consultation</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label htmlFor="notes-input" className="font-semibold text-gray-700 block">
                  Notes for Trainer (Optional)
                </label>
                <textarea
                  id="notes-input"
                  rows={2}
                  placeholder="Any goals, injuries, or focus areas to share..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Booking requires an active membership granting access to the trainer&apos;s home branch.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending || !selectedTrainerId}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {bookMutation.isPending ? 'Confirming Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
