import React, { useState, useEffect } from 'react';
import { X, AlertCircle, LogIn } from 'lucide-react';
import { useCheckIn } from '../../hooks/useAttendance';
import { useMembers } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { AttendanceMethod } from '../../types/attendance.types';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  preselectedBranchId?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
  preselectedBranchId,
}) => {
  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const checkInMutation = useCheckIn();

  // Active members and active branches only
  const activeMembers = members.filter((m) => m.status === 'active');
  const activeBranches = branches.filter((b) => b.status === 'active');

  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [branchId, setBranchId] = useState(preselectedBranchId || '');
  const [method, setMethod] = useState<AttendanceMethod>('manual');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync default branch when selected member changes
  const handleMemberChange = (selectedMemberId: string) => {
    setMemberId(selectedMemberId);
    const selectedMember = activeMembers.find((m) => m._id === selectedMemberId);
    if (selectedMember?.branchId) {
      setBranchId(selectedMember.branchId);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const initialMemberId = preselectedMemberId || '';
      setMemberId(initialMemberId);
      if (initialMemberId) {
        const found = activeMembers.find((m) => m._id === initialMemberId);
        if (found?.branchId) {
          setBranchId(found.branchId);
        }
      } else if (preselectedBranchId) {
        setBranchId(preselectedBranchId);
      } else if (activeBranches.length > 0 && !branchId) {
        setBranchId(activeBranches[0]._id);
      }
      setMethod('manual');
    }
  }, [isOpen, preselectedMemberId, preselectedBranchId, activeMembers, activeBranches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberId) {
      setErrorMsg('Please select an active member.');
      return;
    }
    if (!branchId) {
      setErrorMsg('Please select a branch.');
      return;
    }

    try {
      await checkInMutation.mutateAsync({
        memberId,
        branchId,
        method,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record check-in.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-gym-600" />
              Front Desk Check-In
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Check in an active member into a branch facility.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Active Member Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Active Member <span className="text-red-500">*</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              disabled={isLoadingMembers || checkInMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              required
            >
              <option value="">Select an active member...</option>
              {activeMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.firstName} {m.lastName} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Facility Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={isLoadingBranches || checkInMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              required
            >
              <option value="">Select a branch...</option>
              {activeBranches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.address.city}, {b.address.state})
                </option>
              ))}
            </select>
          </div>

          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Verification Method <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as AttendanceMethod)}
              disabled={checkInMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              required
            >
              <option value="manual">Manual Front Desk Verification</option>
              <option value="qr">QR Code Scanner Pass</option>
              <option value="biometric">Biometric Turnstile</option>
            </select>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 leading-relaxed">
            <strong>Backend Authority Note:</strong> The backend automatically validates whether the member has an active subscription covering today&apos;s UTC calendar date and whether their plan access tier permits entry to this branch.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={checkInMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={checkInMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 rounded-lg hover:bg-gym-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {checkInMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking in...</span>
                </>
              ) : (
                'Confirm Check-In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
