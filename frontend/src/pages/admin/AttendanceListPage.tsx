import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowRight,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useAttendance, useCheckOut, useDeleteAttendance } from '../../hooks/useAttendance';
import { useMembers } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { CheckInModal } from '../../components/attendance/CheckInModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  AttendanceDocument,
  AttendanceStatus,
} from '../../types/attendance.types';

export const AttendanceListPage: React.FC = () => {
  // Query Filters State
  const [checkInDate, setCheckInDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 50;

  // Client search within loaded records
  const [searchTerm, setSearchTerm] = useState('');

  // Assemble query params for GET /api/attendance
  const apiFilters = useMemo(() => {
    const filters: {
      date?: string;
      branchId?: string;
      status?: AttendanceStatus;
      page?: number;
      limit?: number;
    } = {
      page: currentPage,
      limit,
    };
    if (checkInDate.trim()) filters.date = checkInDate.trim();
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (statusFilter !== 'all')
      filters.status = statusFilter as AttendanceStatus;
    return filters;
  }, [checkInDate, branchFilter, statusFilter, currentPage]);

  const {
    data: attendanceResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAttendance(apiFilters);

  // Supplementary data for labels & human-readable linking
  const { data: members = [] } = useMembers();
  const { data: branches = [] } = useBranches();

  // Maps for efficient lookups
  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m._id, `${m.firstName} ${m.lastName}`]));
  }, [members]);

  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Loaded data array & server total matching count
  const loadedRecords = useMemo(
    () => attendanceResponse?.data || [],
    [attendanceResponse?.data]
  );
  const serverTotalCount = attendanceResponse?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(serverTotalCount / limit));

  // Client-side search within loaded records
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return loadedRecords;
    const query = searchTerm.toLowerCase();

    return loadedRecords.filter((record) => {
      const memberName = memberMap.get(record.memberId)?.toLowerCase() || '';
      const branchName = branchMap.get(record.branchId)?.toLowerCase() || '';
      const matchMemberId = record.memberId.toLowerCase().includes(query);
      const matchRecordId = record._id.toLowerCase().includes(query);

      return (
        memberName.includes(query) ||
        branchName.includes(query) ||
        matchMemberId ||
        matchRecordId
      );
    });
  }, [loadedRecords, searchTerm, memberMap, branchMap]);

  // Statistics strictly calculated over loaded records
  const loadedMetrics = useMemo(() => {
    let currentlyInGym = 0;
    let completedVisits = 0;
    let absentLogged = 0;

    for (const record of loadedRecords) {
      if (record.status === 'present') {
        if (!record.checkOutTime) {
          currentlyInGym++;
        } else {
          completedVisits++;
        }
      } else if (record.status === 'absent') {
        absentLogged++;
      }
    }

    return {
      currentlyInGym,
      completedVisits,
      absentLogged,
      loadedTotal: loadedRecords.length,
    };
  }, [loadedRecords]);

  // Modals state
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [deletingAttendance, setDeletingAttendance] = useState<AttendanceDocument | null>(null);
  const [selectedSessionForCheckout, setSelectedSessionForCheckout] =
    useState<AttendanceDocument | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const checkOutMutation = useCheckOut();
  const deleteAttendanceMutation = useDeleteAttendance();

  // Embedded Check-Out action execution
  const handleConfirmCheckout = async () => {
    if (!selectedSessionForCheckout) return;
    setCheckoutError(null);

    try {
      await checkOutMutation.mutateAsync({
        memberId: selectedSessionForCheckout.memberId,
      });
      setSelectedSessionForCheckout(null);
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to complete check-out.');
    }
  };

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const formatDuration = (startIso: string, endIso: string) => {
    if (!startIso || !endIso) return '—';
    try {
      const start = new Date(startIso).getTime();
      const end = new Date(endIso).getTime();
      const diffMinutes = Math.max(0, Math.round((end - start) / 60000));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours === 0) return `${mins}m`;
      return `${hours}h ${mins}m`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-gym-600" />
            Front Desk Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track member check-in stream, facility occupancy, and session check-outs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh attendance stream"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Front Desk Check-In
          </button>
        </div>
      </div>

      {/* KPI Cards: Loaded Record Statistics + Server Total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-emerald-700">
            <span>Currently In Gym</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {isLoading ? '...' : loadedMetrics.currentlyInGym}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Active open check-in session
            {loadedMetrics.currentlyInGym === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gym-700">
            <span>Completed Visits</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gym-700 mt-1">
            {isLoading ? '...' : loadedMetrics.completedVisits}
          </p>
          <p className="text-xs text-gray-400 mt-1">Checked out sessions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Absent Logged</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {isLoading ? '...' : loadedMetrics.absentLogged}
          </p>
          <p className="text-xs text-gray-400 mt-1">Documented absences</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Total Records</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Server Match)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? '...' : serverTotalCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Matching database filter
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Check-in Date Filter */}
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Check-in Date (UTC)
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => {
                setCheckInDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700 w-full"
            />
          </div>

          {/* Branch Filter */}
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Branch Facility
            </label>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700 w-full"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Session Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700 w-full"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* Member Search within Loaded Records */}
          <div className="flex-1 w-full md:pt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search within loaded records by member name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
          <span>
            Check-in Date selects records where check-in timestamp starts with the date.
          </span>
          <span>Showing page {currentPage} of {totalPages} (50 records/page)</span>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading attendance stream...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Failed to load attendance
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {(error as any)?.message ||
                'An error occurred while fetching attendance records.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400 mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No attendance records found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm || branchFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search query, branch filter, or selected check-in date.'
                : 'No check-ins recorded for this date. Click below to check in an active member.'}
            </p>
            {!(
              searchTerm ||
              branchFilter !== 'all' ||
              statusFilter !== 'all'
            ) && (
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Front Desk Check-In
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => {
                  const memberName = memberMap.get(record.memberId);
                  const branchName = branchMap.get(record.branchId);
                  const isOpenSession =
                    record.status === 'present' && !record.checkOutTime;

                  return (
                    <tr
                      key={record._id}
                      className={`transition-colors ${
                        isOpenSession ? 'bg-emerald-50/30' : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/members/${record.memberId}`}
                          className="font-medium text-gym-600 hover:text-gym-700 hover:underline flex items-center gap-1"
                        >
                          <span>{memberName || record.memberId.slice(-8)}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          ID: {record.memberId.slice(-6)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        {branchName || (
                          <span className="font-mono text-xs">
                            {record.branchId.slice(-6)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {formatTimestamp(record.checkInTime)}
                        {record.checkInTime && (
                          <div className="text-[11px] text-gray-400 font-normal">
                            {record.checkInTime.split('T')[0]}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isOpenSession ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 animate-pulse">
                            <Clock className="w-3 h-3" />
                            In Facility
                          </span>
                        ) : record.checkOutTime ? (
                          <span className="text-gray-900 font-medium">
                            {formatTimestamp(record.checkOutTime)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {isOpenSession
                          ? 'Active'
                          : formatDuration(
                              record.checkInTime,
                              record.checkOutTime
                            )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {record.method}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {record.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-gray-500">
                            Absent
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isOpenSession ? (
                            <button
                              onClick={() => {
                                setSelectedSessionForCheckout(record);
                                setCheckoutError(null);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Check Out
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-normal">
                              Completed
                            </span>
                          )}

                          <button
                            onClick={() => setDeletingAttendance(record)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete attendance record permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total matching records in organization: <strong>{serverTotalCount}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Front Desk Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />

      {/* Embedded Check-Out Confirmation Dialog */}
      {selectedSessionForCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-amber-600">
                <div className="p-2 rounded-lg bg-amber-50">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Confirm Member Check-Out
                </h3>
              </div>
              <button
                onClick={() => setSelectedSessionForCheckout(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1">{checkoutError}</div>
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                Are you ready to check out{' '}
                <strong className="text-gray-900">
                  {memberMap.get(selectedSessionForCheckout.memberId) ||
                    selectedSessionForCheckout.memberId}
                </strong>
                ?
              </p>
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div>
                  <span className="text-gray-500">Branch: </span>
                  <span className="font-medium text-gray-800">
                    {branchMap.get(selectedSessionForCheckout.branchId) ||
                      selectedSessionForCheckout.branchId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Check-In Time: </span>
                  <span className="font-mono text-gray-800">
                    {selectedSessionForCheckout.checkInTime}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This will record the current timestamp as the checkout time and close the active session.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedSessionForCheckout(null)}
                disabled={checkOutMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={checkOutMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {checkOutMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Checking out...</span>
                  </>
                ) : (
                  'Complete Check-Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingAttendance}
        onClose={() => setDeletingAttendance(null)}
        onConfirm={async () => {
          if (deletingAttendance) {
            await deleteAttendanceMutation.mutateAsync(deletingAttendance._id);
            setDeletingAttendance(null);
          }
        }}
        title="Delete Attendance Log"
        itemName={deletingAttendance ? `Date: ${deletingAttendance.checkInTime.slice(0, 10)} - Member: ${memberMap.get(deletingAttendance.memberId) || deletingAttendance.memberId}` : ''}
        isLoading={deleteAttendanceMutation.isPending}
      />
    </div>
  );
};
