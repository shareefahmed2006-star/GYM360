import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMembershipPlans,
  useUpdatePlanStatus,
  useDeletePlan,
} from '../../hooks/useMembershipPlans';
import {
  MembershipPlanDocument,
  PlanStatus,
} from '../../types/membershipPlan.types';
import { CreatePlanModal } from '../../components/plan/CreatePlanModal';
import { PlanStatusConfirmModal } from '../../components/plan/PlanStatusConfirmModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  CreditCard,
  Plus,
  Search,
  Power,
  ChevronRight,
  RefreshCw,
  Layers,
  Calendar,
  Trash2,
} from 'lucide-react';

export const PlanListPage: React.FC = () => {
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMembershipPlans();

  const updateStatusMutation = useUpdatePlanStatus();
  const deletePlanMutation = useDeletePlan();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'single_branch' | 'all_branches'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlanDocument | null>(null);
  const [statusModalPlan, setStatusModalPlan] = useState<{
    id: string;
    name: string;
    targetStatus: PlanStatus;
  } | null>(null);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;

    const matchesTier =
      tierFilter === 'all' || p.branchAccess === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const activeCount = plans.filter((p) => p.status === 'active').length;
  const inactiveCount = plans.filter((p) => p.status === 'inactive').length;

  const handleStatusToggleRequest = (plan: MembershipPlanDocument) => {
    const targetStatus: PlanStatus =
      plan.status === 'active' ? 'inactive' : 'active';
    setStatusModalPlan({
      id: plan._id,
      name: plan.name,
      targetStatus,
    });
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusModalPlan) return;
    try {
      await updateStatusMutation.mutateAsync({
        planId: statusModalPlan.id,
        status: statusModalPlan.targetStatus,
      });
      setStatusModalPlan(null);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Action */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <CreditCard className="w-4 h-4" />
            Pricing & Packages
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Membership Plans
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure subscription tiers, package validity durations, pricing, and multi-branch access rights.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh plans list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Package
          </button>
        </div>
      </div>

      {/* 2. Filters & Metrics Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Plans ({plans.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-gray-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Inactive ({inactiveCount})
          </button>

          {/* Access Tier dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gym-500"
            >
              <option value="all">All Access Tiers</option>
              <option value="single_branch">Single Branch Only</option>
              <option value="all_branches">All Branches Roaming</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans by name, perks..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gym-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 3. Plans Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs h-64 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-center justify-between">
          <div>
            <p className="font-bold">Failed to load membership plans.</p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.message || 'Please check your connection and authorization.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No membership plans found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            {searchQuery || tierFilter !== 'all'
              ? 'No plan packages match your active search or access tier criteria.'
              : 'No packages configured yet. Click Create Package above to publish your first tier.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const isActive = plan.status === 'active';
            const isAllBranches = plan.branchAccess === 'all_branches';

            return (
              <div
                key={plan._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-extrabold text-base text-gray-900 tracking-tight leading-snug">
                      {plan.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="space-y-2 text-xs text-gray-600 mb-5">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Validity Duration
                      </span>
                      <span className="font-bold text-gray-900 font-mono">
                        {plan.durationDays} Days
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Access Tier
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          isAllBranches
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {isAllBranches ? 'All Branches' : 'Single Branch'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-400">Package Fee</span>
                      <span className="text-lg font-black text-emerald-700 font-mono">
                        {formatCurrency(plan.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusToggleRequest(plan)}
                    title={isActive ? 'Deactivate package' : 'Reactivate package'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/plans/${plan._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gym-700 hover:text-gym-800 transition-colors"
                    >
                      <span>View & Edit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDeletingPlan(plan)}
                      title="Delete package permanently"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modals */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <PlanStatusConfirmModal
        isOpen={!!statusModalPlan}
        planName={statusModalPlan?.name || ''}
        targetStatus={statusModalPlan?.targetStatus || 'active'}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setStatusModalPlan(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={async () => {
          if (deletingPlan) {
            await deletePlanMutation.mutateAsync(deletingPlan._id);
            setDeletingPlan(null);
          }
        }}
        title="Delete Membership Plan"
        itemName={deletingPlan ? `${deletingPlan.name} (₹${deletingPlan.price})` : ''}
        isLoading={deletePlanMutation.isPending}
      />
    </div>
  );
};
