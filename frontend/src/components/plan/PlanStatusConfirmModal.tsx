import React from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import { PlanStatus } from '../../types/membershipPlan.types';

interface PlanStatusConfirmModalProps {
  isOpen: boolean;
  planName: string;
  targetStatus: PlanStatus;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PlanStatusConfirmModal: React.FC<PlanStatusConfirmModalProps> = ({
  isOpen,
  planName,
  targetStatus,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDeactivating = targetStatus === 'inactive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDeactivating
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isDeactivating ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Power className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isDeactivating
                ? 'Deactivate Membership Plan'
                : 'Reactivate Membership Plan'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Confirm status change for{' '}
              <span className="font-semibold text-gray-800">{planName}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
          {isDeactivating ? (
            <>
              Deactivating this plan marks it as <strong>inactive</strong>. It will
              no longer be available for new member assignments or sales. Existing
              active memberships and historical payment records will remain safely
              unaffected.
            </>
          ) : (
            <>
              Reactivating this plan marks it as <strong>active</strong> and restores
              it to the catalog for new membership assignments.
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
              isDeactivating
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <span>Updating...</span>
            ) : isDeactivating ? (
              <span>Confirm Deactivation</span>
            ) : (
              <span>Confirm Activation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
