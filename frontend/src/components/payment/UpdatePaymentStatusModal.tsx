import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X, CheckCircle, RefreshCcw } from 'lucide-react';
import { useUpdatePaymentStatus } from '../../hooks/usePayments';
import { PaymentDocument, PaymentStatus } from '../../types/payment.types';

interface UpdatePaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDocument | null;
  targetStatus: PaymentStatus;
}

export const UpdatePaymentStatusModal: React.FC<
  UpdatePaymentStatusModalProps
> = ({ isOpen, onClose, payment, targetStatus }) => {
  const updateStatusMutation = useUpdatePaymentStatus();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const isRefund = targetStatus === 'refunded';

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      await updateStatusMutation.mutateAsync({
        paymentId: payment._id,
        status: targetStatus,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message || `Failed to update payment status to ${targetStatus}.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div
            className={`flex items-center gap-2.5 ${
              isRefund ? 'text-purple-600' : 'text-gray-900'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isRefund ? 'bg-purple-50' : 'bg-gray-100'
              }`}
            >
              {isRefund ? (
                <RefreshCcw className="w-5 h-5 text-purple-600" />
              ) : targetStatus === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {isRefund ? 'Process Refund' : `Update Status: ${targetStatus}`}
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
            Confirm transitioning transaction{' '}
            <code className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-1 py-0.5 rounded">
              {payment.transactionReference}
            </code>{' '}
            (${payment.amount.toFixed(2)}) from{' '}
            <span className="font-semibold text-gray-800 capitalize">
              {payment.status}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-gray-900 capitalize">
              {targetStatus}
            </span>
            .
          </p>

          {isRefund ? (
            <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200/60 text-xs text-purple-900 leading-relaxed">
              <strong>Terminal State Warning:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Refunded is a permanent terminal state in the backend.</li>
                <li>This transaction cannot be un-refunded or transitioned again.</li>
                <li>Audit and revenue analytics will record this as a refunded sum.</li>
              </ul>
            </div>
          ) : targetStatus === 'failed' ? (
            <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> Marking a pending transaction as failed transitions it into a terminal state.
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed">
              <strong>Notice:</strong> Marking this transaction as completed registers it as collected gross revenue.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 ${
              isRefund
                ? 'bg-purple-600 hover:bg-purple-700'
                : targetStatus === 'failed'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {updateStatusMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : isRefund ? (
              'Confirm Refund'
            ) : (
              `Mark as ${targetStatus}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
