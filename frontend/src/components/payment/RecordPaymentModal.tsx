import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { useCreatePayment } from '../../hooks/usePayments';
import { useMembers } from '../../hooks/useMembers';
import { useMemberships } from '../../hooks/useMemberships';
import { useMembershipPlans } from '../../hooks/useMembershipPlans';
import { useBranches } from '../../hooks/useBranches';
import {
  PaymentMethod,
  PaymentCreationStatus,
} from '../../types/payment.types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  preselectedMembershipId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
  preselectedMembershipId,
}) => {
  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { data: plans = [] } = useMembershipPlans();
  const { data: branches = [] } = useBranches();
  const createPaymentMutation = useCreatePayment();

  // Active members only
  const activeMembers = members.filter((m) => m.status === 'active');

  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [membershipId, setMembershipId] = useState(
    preselectedMembershipId || ''
  );

  // Fetch memberships for selected member
  const { data: memberMemberships = [], isLoading: isLoadingMemberships } =
    useMemberships(memberId || undefined);

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<PaymentCreationStatus>('completed');
  const [transactionReference, setTransactionReference] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When selected membership changes, find associated plan and set default price
  const selectedMembership = memberMemberships.find(
    (m) => m._id === membershipId
  );
  const selectedBranch = branches.find(
    (b) => b._id === selectedMembership?.branchId
  );

  useEffect(() => {
    if (selectedMembership && !amount) {
      const plan = plans.find((p) => p._id === selectedMembership.planId);
      if (plan && plan.price > 0) {
        setAmount(String(plan.price));
      }
    }
  }, [selectedMembership, plans, amount]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setMemberId(preselectedMemberId || '');
      setMembershipId(preselectedMembershipId || '');
      setAmount('');
      setPaymentMethod('card');
      setStatus('completed');
      setTransactionReference('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, preselectedMemberId, preselectedMembershipId]);

  if (!isOpen) return null;

  const handleMemberChange = (newMemberId: string) => {
    setMemberId(newMemberId);
    setMembershipId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberId) {
      setErrorMsg('Please select an active member.');
      return;
    }
    if (!membershipId) {
      setErrorMsg('Please select a membership subscription.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Payment amount must be a finite number strictly greater than 0.');
      return;
    }

    // Double-check membership belongs to member
    if (selectedMembership && selectedMembership.memberId !== memberId) {
      setErrorMsg('Membership does not belong to the selected member.');
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        memberId,
        membershipId,
        amount: parsedAmount,
        paymentMethod,
        branchId: selectedMembership?.branchId, // Guaranteed matching branchId
        paymentDate: paymentDate || undefined,
        status,
        transactionReference: transactionReference.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gym-600" />
              Record Payment
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Record a transaction against an active member subscription.
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
              disabled={isLoadingMembers || createPaymentMutation.isPending}
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

          {/* Membership Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Membership Subscription <span className="text-red-500">*</span>
            </label>
            <select
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              disabled={
                !memberId ||
                isLoadingMemberships ||
                createPaymentMutation.isPending
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white disabled:bg-gray-50"
              required
            >
              <option value="">
                {!memberId
                  ? 'First select a member above...'
                  : memberMemberships.length === 0
                  ? 'No subscriptions found for this member'
                  : 'Select a subscription...'}
              </option>
              {memberMemberships.map((sub) => {
                const plan = plans.find((p) => p._id === sub.planId);
                return (
                  <option key={sub._id} value={sub._id}>
                    {plan ? plan.name : `Plan ${sub.planId.slice(-6)}`} —{' '}
                    Status: {sub.status} (Exp: {sub.endDate})
                  </option>
                );
              })}
            </select>
            {selectedBranch && (
              <p className="text-xs text-gray-500 mt-1">
                Branch (derived from subscription):{' '}
                <span className="font-medium text-gray-800">
                  {selectedBranch.name}
                </span>
              </p>
            )}
          </div>

          {/* Amount and Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 99.00"
                disabled={createPaymentMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                disabled={createPaymentMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
                required
              >
                <option value="card">Credit / Debit Card</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Date & Initial Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={createPaymentMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PaymentCreationStatus)
                }
                disabled={createPaymentMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Transaction Reference (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Transaction Reference (Optional)
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. TXN-CARD-90123 (Leave blank to auto-generate)"
              disabled={createPaymentMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              If omitted, a unique system reference (GYM360-TXN-...) will be generated automatically.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={createPaymentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 rounded-lg hover:bg-gym-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                'Save Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
