import React, { useState } from 'react';
import { useCreatePlan } from '../../hooks/useMembershipPlans';
import { BranchAccessTier } from '../../types/membershipPlan.types';
import { ErrorAlert } from '../common/ErrorAlert';
import { X, CreditCard, Layers } from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createPlanMutation = useCreatePlan();

  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationDays: '',
    price: '',
    branchAccess: 'single_branch' as BranchAccessTier,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedDesc = formData.description.trim();

    if (!trimmedName) {
      setFormError('Plan name is required.');
      return;
    }

    if (!trimmedDesc) {
      setFormError('Plan description is required.');
      return;
    }

    const numericDuration = Number(formData.durationDays);
    if (
      !Number.isInteger(numericDuration) ||
      numericDuration <= 0 ||
      numericDuration > 2147483647
    ) {
      setFormError(
        'Duration in days must be a positive whole integer greater than zero.'
      );
      return;
    }

    const numericPrice = Number(formData.price);
    if (
      typeof numericPrice !== 'number' ||
      isNaN(numericPrice) ||
      numericPrice < 0 ||
      !Number.isFinite(numericPrice)
    ) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }

    try {
      await createPlanMutation.mutateAsync({
        name: trimmedName,
        description: trimmedDesc,
        durationDays: numericDuration,
        price: numericPrice,
        branchAccess: formData.branchAccess,
      });

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        durationDays: '',
        price: '',
        branchAccess: 'single_branch',
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create membership plan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <CreditCard className="w-5 h-5 text-gym-600" />
            <h2 className="text-base">Create New Membership Package</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4">
            <ErrorAlert message={formError} onClose={() => setFormError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Package Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Annual Gold Tier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of plan privileges, access hours, and perks..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Duration (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="2147483647"
                value={formData.durationDays}
                onChange={(e) =>
                  setFormData({ ...formData, durationDays: e.target.value })
                }
                placeholder="e.g. 30, 90, 365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Package Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Branch Access Tier *
            </label>
            <div className="relative">
              <select
                required
                value={formData.branchAccess}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branchAccess: e.target.value as BranchAccessTier,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white pr-8"
              >
                <option value="single_branch">
                  Single Branch Access (Restricted to home branch)
                </option>
                <option value="all_branches">
                  All Branches Access (Multi-facility roaming privilege)
                </option>
              </select>
              <Layers className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {createPlanMutation.isPending
                ? 'Creating Plan...'
                : 'Save & Publish Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
