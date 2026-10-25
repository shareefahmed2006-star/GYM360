import React from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import { BranchStatus } from '../../types/branch.types';

interface BranchStatusConfirmModalProps {
  isOpen: boolean;
  branchName: string;
  targetStatus: BranchStatus;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BranchStatusConfirmModal: React.FC<BranchStatusConfirmModalProps> = ({
  isOpen,
  branchName,
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
              isDeactivating ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
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
              {isDeactivating ? 'Deactivate Branch Facility' : 'Reactivate Branch Facility'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Confirm status change for <span className="font-semibold text-gray-800">{branchName}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
          {isDeactivating ? (
            <>
              Deactivating this branch marks the facility as <strong>inactive</strong>. Existing member records and data remain safely preserved, but new attendance check-ins will be restricted.
            </>
          ) : (
            <>
              Reactivating this branch marks the facility as <strong>active</strong> and restores operational access for front desk and member workflows.
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
