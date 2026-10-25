import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useCreateMembership } from '../../hooks/useMemberships';
import { useMembers } from '../../hooks/useMembers';
import { useMembershipPlans } from '../../hooks/useMembershipPlans';
import { useBranches } from '../../hooks/useBranches';

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export const EnrollMemberModal: React.FC<EnrollMemberModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
}) => {
  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { data: plans = [], isLoading: isLoadingPlans } = useMembershipPlans();
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const createMembershipMutation = useCreateMembership();

  // Filter only active members, active plans, active branches
  const activeMembers = members.filter((m) => m.status === 'active');
  const activePlans = plans.filter((p) => p.status === 'active');
  const activeBranches = branches.filter((b) => b.status === 'active');

  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [planId, setPlanId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [autoRenew, setAutoRenew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync member default branch when member changes
  const handleMemberChange = (selectedMemberId: string) => {
    setMemberId(selectedMemberId);
    const selectedMember = activeMembers.find((m) => m._id === selectedMemberId);
    if (selectedMember?.branchId) {
      setBranchId(selectedMember.branchId);
    }
  };

  // Reset form when modal closes or opens
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const initialMemberId = preselectedMemberId || '';
      setMemberId(initialMemberId);
      if (initialMemberId) {
        const found = activeMembers.find((m) => m._id === initialMemberId);
        if (found?.branchId) {
          setBranchId(found.branchId);
        }
      }
    }
  }, [isOpen, preselectedMemberId, activeMembers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberId) {
      setErrorMsg('Please select an active member.');
      return;
    }
    if (!planId) {
      setErrorMsg('Please select an active membership plan.');
      return;
    }

    try {
      await createMembershipMutation.mutateAsync({
        memberId,
        planId,
        branchId: branchId || undefined,
        startDate: startDate || undefined,
        autoRenew,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to enroll member into the subscription.'
      );
    }
  };

  const selectedPlan = activePlans.find((p) => p._id === planId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Enroll Member Subscription
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Assign an active membership plan to an active member.
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
          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              disabled={isLoadingMembers || createMembershipMutation.isPending}
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

          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Membership Plan <span className="text-red-500">*</span>
            </label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={isLoadingPlans || createMembershipMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              required
            >
              <option value="">Select a membership plan...</option>
              {activePlans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ${p.price} ({p.durationDays} days)
                </option>
              ))}
            </select>
            {selectedPlan && (
              <div className="mt-1.5 p-2 bg-gray-50 rounded-md border border-gray-100 text-xs text-gray-600">
                <span className="font-medium text-gray-800">
                  {selectedPlan.name}:
                </span>{' '}
                {selectedPlan.description || 'No description'}. Access tier:{' '}
                <span className="capitalize font-medium">
                  {selectedPlan.branchAccess.replace('_', ' ')}
                </span>
                .
              </div>
            )}
          </div>

          {/* Branch Assignment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Branch Assignment
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={isLoadingBranches || createMembershipMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="">
                Member&apos;s Home Branch (Default)
              </option>
              {activeBranches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.address.city}, {b.address.state})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={createMembershipMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              End date is calculated automatically by the backend based on plan duration.
            </p>
          </div>

          {/* Auto Renew */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoRenew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              disabled={createMembershipMutation.isPending}
              className="h-4 w-4 rounded-sm border-gray-300 text-gym-600 focus:ring-gym-500"
            />
            <label
              htmlFor="autoRenew"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Enable Automatic Renewal
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={createMembershipMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMembershipMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 rounded-lg hover:bg-gym-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {createMembershipMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                'Confirm Enrollment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
