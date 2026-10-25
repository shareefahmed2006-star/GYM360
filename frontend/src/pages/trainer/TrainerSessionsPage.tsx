import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerPortalApi } from '../../api/trainerPortalApi';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  AlertCircle,
} from 'lucide-react';

export const TrainerSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: sessions = [], isLoading, isError, error } = useQuery({
    queryKey: ['trainer-sessions', statusFilter],
    queryFn: () => trainerPortalApi.listSessions({ status: statusFilter || undefined }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      trainerPortalApi.updateSessionStatus(sessionId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-dashboard'] });
    },
  });

  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const clientName = s.member
      ? `${s.member.firstName} ${s.member.lastName}`.toLowerCase()
      : '';
    const type = s.sessionType.toLowerCase();
    return clientName.includes(term) || type.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Sessions & Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all appointments and mark attendance status for your clients.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client or session type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center bg-white rounded-xl border border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <span className="text-xs text-gray-500">Loading sessions...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="text-sm font-semibold text-red-800">Failed to load sessions</p>
          <p className="text-xs text-red-600 mt-1">{(error as any)?.message}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No sessions match your filter</h3>
          <p className="text-xs text-gray-400 mt-1">Try clearing your search query or selecting a different status.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Client Name</th>
                  <th className="px-6 py-3.5 font-semibold">Date & Time</th>
                  <th className="px-6 py-3.5 font-semibold">Session Type</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {session.member?.firstName?.[0] || 'C'}
                        </div>
                        <div>
                          <span>
                            {session.member
                              ? `${session.member.firstName} ${session.member.lastName}`
                              : 'Client'}
                          </span>
                          {session.member?.phone && (
                            <span className="block text-xs text-gray-400">
                              {session.member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {session.sessionDate} • {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      <span className="bg-gray-100 px-2.5 py-1 rounded-md text-gray-800">
                        {session.sessionType}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                          session.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {session.status === 'scheduled' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                sessionId: session._id,
                                status: 'completed',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
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
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
