import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useMembershipPlan,
  useUpdatePlan,
  useUpdatePlanStatus,
} from '../../hooks/useMembershipPlans';
import {
  BranchAccessTier,
  PlanStatus,
} from '../../types/membershipPlan.types';
import { PlanStatusConfirmModal } from '../../components/plan/PlanStatusConfirmModal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ApiError } from '../../api/types';
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  Layers,
  Power,
  Save,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export const PlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();

  const { data: plan, isLoading, isError, error, refetch } = useMembershipPlan(planId);
  const updatePlanMutation = useUpdatePlan();
  const updateStatusMutation = useUpdatePlanStatus();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Special alert for 409 Conflict when terms are referenced by memberships
  const [referencedTermsError, setReferencedTermsError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationDays: '',
    price: '',
    branchAccess: 'single_branch' as BranchAccessTier,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        durationDays: String(plan.durationDays),
        price: String(plan.price),
        branchAccess: plan.branchAccess,
      });
    }
  }, [plan]);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-28 animate-pulse" />
        <div className="bg-white rounded-2xl p-8 border border-gray-200 h-96 animate-pulse" />
      </div>
    );
  }

  if (isError || !plan) {
    const statusCode = (error as any)?.statusCode;
    const is403 = statusCode === 403;
    const is404 = statusCode === 404;

    return (
      <div className="space-y-6">
        <Link
          to="/admin/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans Catalog
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {is403
              ? 'Access Denied'
              : is404
              ? 'Membership Plan Not Found or Unavailable'
              : 'Unable to Load Membership Plan'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            {is403
              ? 'You do not have authorization to view this membership plan.'
              : is404
              ? 'The requested membership plan does not exist or belongs to another organization.'
              : (error as any)?.message || 'A network error occurred.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/admin/plans"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Back to Catalog
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

  const isActive = plan.status === 'active';
  const targetStatus: PlanStatus = isActive ? 'inactive' : 'active';

  const handleStatusToggleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        planId: plan._id,
        status: targetStatus,
      });
      setIsStatusModalOpen(false);
      setFormSuccess(`Plan marked as ${targetStatus}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update plan status.');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setReferencedTermsError(null);

    const trimmedName = formData.name.trim();
    const trimmedDesc = formData.description.trim();

    if (!trimmedName || !trimmedDesc) {
      setFormError('Plan name and description are required.');
      return;
    }

    const numericDuration = Number(formData.durationDays);
    if (
      !Number.isInteger(numericDuration) ||
      numericDuration <= 0 ||
      numericDuration > 2147483647
    ) {
      setFormError('Duration must be a positive integer (e.g. 30, 365).');
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
      await updatePlanMutation.mutateAsync({
        planId: plan._id,
        dto: {
          name: trimmedName,
          description: trimmedDesc,
          durationDays: numericDuration,
          price: numericPrice,
          branchAccess: formData.branchAccess,
        },
      });
      setFormSuccess('Membership plan updated successfully.');
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setReferencedTermsError(
          'Protected Terms Locked: Plan terms (duration, price, branchAccess) cannot be modified because this plan is referenced by existing memberships. You may still update the name and description, or create a new plan package for new pricing.'
        );
      } else {
        setFormError(err?.message || 'Failed to update plan.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Navigation & Quick Status Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans Catalog</span>
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
          <span>{isActive ? 'Deactivate Package' : 'Reactivate Package'}</span>
        </button>
      </div>

      {/* 2. Overview Hero Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gym-50 text-gym-700 flex items-center justify-center shrink-0 border border-gym-100 font-bold text-xl">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {plan.name}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {plan.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Package ID: <span className="font-mono">{plan._id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Duration</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {plan.durationDays} Days
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Access Scope</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5 capitalize">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              {plan.branchAccess.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Current Fee</span>
            <span className="font-bold text-emerald-700 font-mono text-sm mt-0.5 block">
              {formatCurrency(plan.price)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. In-Place Edit Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h2 className="text-base font-bold text-gray-900">Configure Package Terms</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Modify plan marketing details, duration validity, fee structures, and access tiers.
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

        {referencedTermsError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">Referenced Terms Protected</p>
              <p className="mt-0.5">{referencedTermsError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Package Name *
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
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fee Price (₹) *
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Branch Access Tier *
              </label>
              <select
                value={formData.branchAccess}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branchAccess: e.target.value as BranchAccessTier,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white"
              >
                <option value="single_branch">Single Branch Access</option>
                <option value="all_branches">All Branches Roaming</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={updatePlanMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {updatePlanMutation.isPending
                  ? 'Saving Changes...'
                  : 'Save Package Terms'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Status Confirm Modal */}
      <PlanStatusConfirmModal
        isOpen={isStatusModalOpen}
        planName={plan.name}
        targetStatus={targetStatus}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleStatusToggleConfirm}
        onCancel={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};
