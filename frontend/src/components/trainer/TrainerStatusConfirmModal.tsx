import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useUpdateTrainer } from '../../hooks/useTrainers';
import { TrainerDocument } from '../../types/trainer.types';

interface TrainerStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: TrainerDocument | null;
}

export const TrainerStatusConfirmModal: React.FC<
  TrainerStatusConfirmModalProps
> = ({ isOpen, onClose, trainer }) => {
  const updateTrainerMutation = useUpdateTrainer();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !trainer) return null;

  const isDeactivating = trainer.status === 'active';
  const targetStatus = isDeactivating ? 'inactive' : 'active';

  const handleConfirm = async () => {
    setErrorMsg(null);
    try {
      await updateTrainerMutation.mutateAsync({
        trainerId: trainer._id,
        dto: { status: targetStatus },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message || `Failed to transition trainer status to ${targetStatus}.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div
            className={`flex items-center gap-2.5 ${
              isDeactivating ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isDeactivating ? 'bg-amber-50' : 'bg-emerald-50'
              }`}
            >
              {isDeactivating ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {isDeactivating ? 'Deactivate Trainer' : 'Activate Trainer'}
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
            Are you sure you want to change the status of coach{' '}
            <strong className="text-gray-900">
              {trainer.firstName} {trainer.lastName}
            </strong>{' '}
            to <span className="font-semibold capitalize">{targetStatus}</span>?
          </p>

          {isDeactivating ? (
            <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              <strong>Operational Impact:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>
                  Backend session booking rules reject new appointments for inactive trainers.
                </li>
                <li>
                  Previously scheduled appointments remain documented in history.
                </li>
                <li>Trainer record is preserved (never deleted).</li>
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed">
              <strong>Activation:</strong> This trainer will become active and available for branch appointments and training programs.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={updateTrainerMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateTrainerMutation.isPending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 ${
              isDeactivating
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {updateTrainerMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : isDeactivating ? (
              'Confirm Deactivation'
            ) : (
              'Confirm Activation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
