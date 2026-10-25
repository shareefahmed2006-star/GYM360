import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useBranch,
  useUpdateBranch,
  useUpdateBranchStatus,
} from '../../hooks/useBranches';
import { BranchStatusConfirmModal } from '../../components/branch/BranchStatusConfirmModal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  GitBranch,
  ArrowLeft,
  Save,
  Power,
  Clock,
  Phone,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const BranchDetailPage: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();

  const { data: branch, isLoading, isError, error, refetch } = useBranch(branchId);
  const updateBranchMutation = useUpdateBranch();
  const updateStatusMutation = useUpdateBranchStatus();

  // Status toggle confirmation modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Edit form state
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    capacity: '',
    openingTime: '',
    closingTime: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Populate form state when data loads
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        phone: branch.phone,
        capacity: String(branch.capacity),
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        street: branch.address.street,
        city: branch.address.city,
        state: branch.address.state,
        postalCode: branch.address.postalCode,
      });
    }
  }, [branch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-28 animate-pulse" />
        <div className="bg-white rounded-2xl p-8 border border-gray-200 h-96 animate-pulse" />
      </div>
    );
  }

  // Handle specific error codes cleanly
  if (isError || !branch) {
    const statusCode = (error as any)?.statusCode;
    const is403 = statusCode === 403;
    const is404 = statusCode === 404;

    return (
      <div className="space-y-6">
        <Link
          to="/admin/branches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Branches
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {is403
              ? 'Access Denied'
              : is404
              ? 'Branch Not Found or Unavailable'
              : 'Unable to Load Branch'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            {is403
              ? 'You do not have authorization to view this branch facility.'
              : is404
              ? 'The requested branch does not exist or does not belong to your organization.'
              : (error as any)?.message || 'A network error occurred.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/admin/branches"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Back to Branch List
            </Link>
            {!is403 && !is404 && (
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg"
              >
                Retry Request
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isActive = branch.status === 'active';
  const targetStatus = isActive ? 'inactive' : 'active';

  const handleStatusToggleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        branchId: branch._id,
        status: targetStatus,
      });
      setIsStatusModalOpen(false);
      setFormSuccess(`Branch marked as ${targetStatus}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update branch status.');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedStreet = formData.street.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();
    const trimmedPostal = formData.postalCode.trim();

    if (
      !trimmedName ||
      !trimmedPhone ||
      !trimmedStreet ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostal
    ) {
      setFormError('All fields and complete address are required.');
      return;
    }

    const numericCapacity = Number(formData.capacity);
    if (
      !Number.isInteger(numericCapacity) ||
      numericCapacity <= 0 ||
      numericCapacity > 2147483647
    ) {
      setFormError('Capacity must be a positive integer (e.g. 150).');
      return;
    }

    try {
      await updateBranchMutation.mutateAsync({
        branchId: branch._id,
        dto: {
          name: trimmedName,
          phone: trimmedPhone,
          capacity: numericCapacity,
          openingTime: formData.openingTime.trim(),
          closingTime: formData.closingTime.trim(),
          address: {
            street: trimmedStreet,
            city: trimmedCity,
            state: trimmedState,
            postalCode: trimmedPostal,
          },
        },
      });
      setFormSuccess('Branch profile updated successfully.');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update branch.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/branches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Branch List</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsStatusModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            isActive
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isActive ? 'Deactivate Branch' : 'Activate Branch'}</span>
        </button>
      </div>

      {/* 2. Facility Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gym-50 text-gym-700 flex items-center justify-center shrink-0 border border-gym-100">
            <GitBranch className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {branch.name}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {branch.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Branch Identifier: <span className="font-mono">{branch._id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Facility Capacity</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {branch.capacity} members
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Daily Hours</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {branch.openingTime} - {branch.closingTime}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Contact</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {branch.phone}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Edit Branch Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h2 className="text-base font-bold text-gray-900">Edit Facility Information</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Update location details, capacity limits, and operating hours.
          </p>
        </div>

        {formSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {formSuccess}
          </div>
        )}

        {formError && (
          <div className="mb-6">
            <ErrorAlert message={formError} onClose={() => setFormError(null)} />
          </div>
        )}

        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Max Capacity (Members) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="2147483647"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Opening Time *
              </label>
              <input
                type="text"
                required
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                placeholder="06:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Closing Time *
              </label>
              <input
                type="text"
                required
                value={formData.closingTime}
                onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                placeholder="22:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={updateBranchMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateBranchMutation.isPending ? 'Saving Changes...' : 'Save Branch Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Status Confirm Modal */}
      <BranchStatusConfirmModal
        isOpen={isStatusModalOpen}
        branchName={branch.name}
        targetStatus={targetStatus}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleStatusToggleConfirm}
        onCancel={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};
