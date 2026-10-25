import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useCancelMembership } from '../../hooks/useMemberships';
import { MembershipDocument } from '../../types/membership.types';

interface CancelMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  membership: MembershipDocument | null;
}

export const CancelMembershipModal: React.FC<CancelMembershipModalProps> = ({
  isOpen,
  onClose,
  membership,
}) => {
  const cancelMembershipMutation = useCancelMembership();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !membership) return null;

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      await cancelMembershipMutation.mutateAsync(membership._id);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to cancel membership subscription.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="p-2 rounded-lg bg-amber-50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Cancel Membership
            </h3>
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

        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>
            Are you sure you want to cancel this membership subscription (ID:{' '}
            <code className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-1 py-0.5 rounded">
              {membership._id}
            </code>
            )?
          </p>
          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 text-xs text-amber-800 leading-relaxed">
            <strong>Consequences of cancellation:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Status will immediately transition to <strong>cancelled</strong>.</li>
              <li>Auto-renewal will be disabled.</li>
              <li>Past attendance, payment, and audit logs will remain intact.</li>
              <li>This operation cannot be reversed directly.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelMembershipMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Keep Membership
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancelMembershipMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {cancelMembershipMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
