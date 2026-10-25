import React, { useState } from 'react';
import { useCreateMember } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { ErrorAlert } from '../common/ErrorAlert';
import { X, UserPlus, Building } from 'lucide-react';
import { ApiError } from '../../api/types';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: branches = [] } = useBranches();
  const createMemberMutation = useCreateMember();

  // Active branches belonging strictly to the authenticated tenant
  const activeBranches = branches.filter((b) => b.status === 'active');

  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    branchId: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const selectedBranch = formData.branchId.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedEmail || !selectedBranch) {
      setFormError('First name, last name, email, and home branch are required.');
      return;
    }

    try {
      await createMemberMutation.mutateAsync({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        branchId: selectedBranch,
        phone: trimmedPhone || undefined,
        dateOfBirth: formData.dateOfBirth.trim() || undefined,
        gender: formData.gender.trim() || undefined,
        emergencyContact:
          formData.emergencyContactName.trim() && formData.emergencyContactPhone.trim()
            ? {
                name: formData.emergencyContactName.trim(),
                phone: formData.emergencyContactPhone.trim(),
              }
            : undefined,
      });

      // Reset and close on success
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        branchId: '',
        dateOfBirth: '',
        gender: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setFormError('A member with this email address already exists in your organization.');
      } else {
        setFormError(err?.message || 'Failed to register member. Please check input fields.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <UserPlus className="w-5 h-5 text-gym-600" />
            <h2 className="text-base">Register New Member Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Assigned Home Branch *
            </label>
            <div className="relative">
              <select
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white pr-8"
              >
                <option value="">Select an active facility branch...</option>
                {activeBranches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} — {branch.address.city}
                  </option>
                ))}
              </select>
              <Building className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {activeBranches.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No active branches available. Please activate or create a branch first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white"
              >
                <option value="">Not Specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Emergency Contact (Optional)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Contact Phone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>
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
              disabled={createMemberMutation.isPending || activeBranches.length === 0}
              className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {createMemberMutation.isPending ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
