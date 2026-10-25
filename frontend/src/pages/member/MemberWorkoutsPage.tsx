import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberWorkflowApi } from '../../api/memberWorkflowApi';
import {
  MemberWorkoutPlanDocument,
  WorkoutPlanDocument,
} from '../../types/memberWorkflow.types';
import {
  Dumbbell,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

export const MemberWorkoutsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    assignment: MemberWorkoutPlanDocument;
    plan?: WorkoutPlanDocument;
  } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Query Assigned Workouts
  const {
    data: assignments = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['memberWorkouts'],
    queryFn: () => memberWorkflowApi.listMemberWorkouts(),
  });

  // 2. Fetch master plan details for assigned plans
  const [planMap, setPlanMap] = useState<Record<string, WorkoutPlanDocument>>({});

  useEffect(() => {
    const fetchPlanDetails = async () => {
      const uniquePlanIds = Array.from(new Set(assignments.map((a) => a.workoutPlanId)));
      const missingIds = uniquePlanIds.filter((id) => !planMap[id]);

      if (missingIds.length === 0) return;

      const newMap: Record<string, WorkoutPlanDocument> = { ...planMap };
      for (const id of missingIds) {
        try {
          const plan = await memberWorkflowApi.getWorkoutPlanDetails(id);
          newMap[id] = plan;
        } catch {
          // Fallback if individual plan cannot be fetched
        }
      }
      setPlanMap(newMap);
    };

    if (assignments.length > 0) {
      fetchPlanDetails();
    }
  }, [assignments, planMap]);

  // 3. Complete Workout Plan Mutation
  const completeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      memberWorkflowApi.completeWorkoutAssignment(assignmentId),
    onSuccess: () => {
      setActionSuccess('Congratulations! Workout program marked as completed.');
      queryClient.invalidateQueries({ queryKey: ['memberWorkouts'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update program status.');
    },
  });

  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const getDifficultyBadge = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'advanced':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
            <Dumbbell className="w-4 h-4" />
            Training Regimens & Fitness Programs
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Assigned Workout Routines
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tailored fitness plans assigned by your certified trainers to reach your fitness goals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-purple-600' : ''}`} />
          {isFetching ? 'Syncing...' : 'Sync Routines'}
        </button>
      </div>

      {/* Alerts */}
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 bg-gray-100'
          }`}
        >
          All Programs ({assignments.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 bg-gray-100'
          }`}
        >
          In Progress ({assignments.filter((a) => a.status === 'active').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 bg-gray-100'
          }`}
        >
          Completed ({assignments.filter((a) => a.status === 'completed').length})
        </button>
      </div>

      {/* Program Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-xs text-red-700">
          Failed to load assigned workout plans.
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 space-y-2">
          <Dumbbell className="w-8 h-8 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Workout Programs in This Category</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Your trainers haven&apos;t assigned any programs matching this filter yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const plan = planMap[assignment.workoutPlanId];
            const isActive = assignment.status === 'active';
            const isCompleted = assignment.status === 'completed';

            return (
              <div
                key={assignment._id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-purple-200 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCompleted
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {assignment.status}
                        </span>
                        {plan?.difficulty && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getDifficultyBadge(
                              plan.difficulty
                            )}`}
                          >
                            {plan.difficulty}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mt-2">
                        {plan?.name || 'Custom Training Program'}
                      </h3>
                      {plan?.goal && (
                        <p className="text-xs text-gym-700 font-semibold mt-0.5 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-gym-600" />
                          Goal: {plan.goal}
                        </p>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  {plan?.description && (
                    <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Program Duration & Dates */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{assignment.startDate} to {assignment.endDate}</span>
                    </div>
                    {plan?.durationWeeks && (
                      <div className="flex items-center gap-1.5 font-mono justify-end">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{plan.durationWeeks} Weeks Program</span>
                      </div>
                    )}
                  </div>

                  {/* Trainer Notes */}
                  {assignment.notes && (
                    <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                      <strong className="text-gray-700">Coach Guidance:</strong> {assignment.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanDetails({ assignment, plan })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    View Program Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => completeMutation.mutate(assignment._id)}
                      disabled={completeMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                  {selectedPlanDetails.plan?.difficulty || 'Training Program'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedPlanDetails.plan?.name || 'Workout Program'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanDetails(null)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-gray-500 uppercase tracking-wider text-[11px] block">
                  Program Overview
                </strong>
                <p className="text-gray-700 mt-1 leading-relaxed">
                  {selectedPlanDetails.plan?.description || 'Comprehensive training plan.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Primary Fitness Goal:</span>
                  <span className="font-bold text-gray-900">{selectedPlanDetails.plan?.goal || 'General Fitness'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Duration:</span>
                  <span className="font-bold text-gray-900">{selectedPlanDetails.plan?.durationWeeks || 4} Weeks</span>
                </div>
              </div>

              {selectedPlanDetails.assignment.notes && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-purple-800 font-bold block text-[11px]">Trainer Instructions:</span>
                  <p className="text-purple-900 mt-0.5">{selectedPlanDetails.assignment.notes}</p>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>
                  Exercise routines are configured directly by your trainer. Consult your personal trainer for exercise sets and rep adjustments.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlanDetails(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
