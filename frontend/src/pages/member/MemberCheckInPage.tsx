import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance, useCheckIn, useCheckOut } from '../../hooks/useAttendance';
import { useBranches } from '../../hooks/useBranches';
import {
  QrCode,
  Building2,
  CalendarCheck,
  Clock,
  LogOut,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const MemberCheckInPage: React.FC = () => {
  const { user } = useAuth();
  const { data: attendanceResponse, isLoading, isError, refetch, isFetching } = useAttendance();
  const { data: branches = [] } = useBranches();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const attendanceList = attendanceResponse?.data || [];

  // Active branches map
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Set default branch if not selected
  const activeBranchId = useMemo(() => {
    if (selectedBranchId) return selectedBranchId;
    return branches.length > 0 ? branches[0]._id : '';
  }, [selectedBranchId, branches]);

  // Detect open active attendance session
  const openSession = useMemo(() => {
    return attendanceList.find((a) => a.status === 'present' && (!a.checkOutTime || a.checkOutTime === ''));
  }, [attendanceList]);

  const handleCheckIn = async () => {
    setActionError(null);
    setActionSuccess(null);

    if (!user?.memberId) {
      setActionError('Member profile is not linked to your user account.');
      return;
    }

    if (!activeBranchId) {
      setActionError('Please select a facility branch to check in.');
      return;
    }

    try {
      await checkInMutation.mutateAsync({
        memberId: user.memberId,
        branchId: activeBranchId,
        method: 'qr',
      });
      setActionSuccess('Check-in confirmed! Welcome to the facility.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete check-in. Check membership validity.');
    }
  };

  const handleCheckOut = async () => {
    setActionError(null);
    setActionSuccess(null);

    if (!user?.memberId) {
      setActionError('Member profile is not linked.');
      return;
    }

    try {
      await checkOutMutation.mutateAsync({
        memberId: user.memberId,
      });
      setActionSuccess('Checked out successfully. Have a great day!');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete check-out.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <QrCode className="w-4 h-4" />
            Facility Access & Front Desk Pass
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Member Check-In
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Scan your turnstile pass or register your daily visit at any authorized branch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
          {isFetching ? 'Syncing...' : 'Sync Status'}
        </button>
      </div>

      {/* Action Feedback Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
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
            className="text-xs font-bold text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Check-In Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass / Interactive Scanner Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col items-center text-center space-y-4">
          <div className="w-full text-left pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Digital Turnstile Pass
            </span>
            <span className="text-[11px] text-gray-400">
              Simulated member QR credential
            </span>
          </div>

          {/* Styled QR Code Box */}
          <div className="p-4 bg-gray-900 rounded-2xl shadow-md border border-gray-800 w-52 h-52 flex flex-col items-center justify-center relative group">
            {/* SVG Geometric QR Representation */}
            <div className="w-40 h-40 bg-white p-3 rounded-xl flex flex-col items-center justify-between">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-gray-50 rounded">
                {[...Array(36)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-2xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-gray-900'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-2 tracking-widest">
              PASS: {user?.memberId ? `MEM-${user.memberId.slice(-6)}` : 'ACTIVE'}
            </span>
          </div>

          <div className="w-full text-left space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Cardholder:</span>
              <strong className="text-gray-900 font-semibold">{user?.firstName} {user?.lastName}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Member ID:</span>
              <strong className="text-gray-900 font-mono text-[11px]">{user?.memberId || 'N/A'}</strong>
            </div>
          </div>

          <div className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-left text-[11px] text-gray-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span>
              Simulated pass for automated turnstile check-in. Validated in real-time by gym servers.
            </span>
          </div>
        </div>

        {/* Live Session Status & Actions Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    openSession
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {openSession ? 'Facility Visit in Progress' : 'Ready for Check-In'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {openSession
                      ? `Session initiated at ${openSession.checkInTime.slice(11, 16)} UTC`
                      : 'You are currently outside the gym facility'}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  openSession
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    openSession ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                {openSession ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>

            <div className="pt-5 space-y-4">
              {openSession ? (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Facility Location:</span>
                      <strong className="text-gray-900 text-sm font-semibold">
                        {branchMap.get(openSession.branchId) || 'Branch ' + openSession.branchId.slice(-6)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Check-In Timestamp:</span>
                      <strong className="text-gray-900 font-mono text-sm">
                        {openSession.checkInTime}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      disabled={checkOutMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {checkOutMutation.isPending ? 'Logging Out...' : 'Check Out of Facility'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="branch-select" className="text-xs font-semibold text-gray-700 block">
                      Select Facility Branch
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                      <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                      <select
                        id="branch-select"
                        value={activeBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="bg-transparent border-0 font-semibold text-gray-800 focus:outline-hidden w-full cursor-pointer"
                      >
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name} ({b.address?.city || 'Facility'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending || !activeBranchId}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gym-600 hover:bg-gym-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    {checkInMutation.isPending ? 'Verifying Pass...' : 'Confirm Turnstile / QR Check-In'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Personal Visit History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Personal Attendance History
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your past facility visits and recorded check-in times.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                {attendanceList.length} Total Visits
              </span>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-xs text-red-700">
                Failed to load attendance history.
              </div>
            ) : attendanceList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No attendance visits recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Branch</th>
                      <th className="py-2.5 px-4">Check-In</th>
                      <th className="py-2.5 px-4">Check-Out</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceList.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-4 font-mono font-medium text-gray-900">
                          {record.checkInTime.slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800">
                          {branchMap.get(record.branchId) || 'Branch ' + record.branchId.slice(-6)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-600">
                          {record.checkInTime.slice(11, 19)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-600">
                          {record.checkOutTime ? (
                            record.checkOutTime.slice(11, 19)
                          ) : (
                            <span className="text-emerald-600 font-bold">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-gray-500">
                          {record.method}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
