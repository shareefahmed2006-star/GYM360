import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ArrowRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemberships, useDeleteMembership } from '../../hooks/useMemberships';
import { useMembers } from '../../hooks/useMembers';
import { useMembershipPlans } from '../../hooks/useMembershipPlans';
import { useBranches } from '../../hooks/useBranches';
import { EnrollMemberModal } from '../../components/membership/EnrollMemberModal';
import { CancelMembershipModal } from '../../components/membership/CancelMembershipModal';
import { RenewModal } from '../../components/membership/RenewModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { MembershipDocument } from '../../types/membership.types';

export const MembershipListPage: React.FC = () => {
  const {
    data: memberships = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMemberships();

  // Supplementary data for labels & human-readable linking
  const { data: members = [] } = useMembers();
  const { data: plans = [] } = useMembershipPlans();
  const { data: branches = [] } = useBranches();

  // Maps for efficient ID-to-name lookup
  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m._id, `${m.firstName} ${m.lastName}`]));
  }, [members]);

  const planMap = useMemo(() => {
    return new Map(plans.map((p) => [p._id, p.name]));
  }, [plans]);

  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [renewFilter, setRenewFilter] = useState<string>('all');

  // Modals state
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [cancellingMembership, setCancellingMembership] =
    useState<MembershipDocument | null>(null);
  const [renewingMembership, setRenewingMembership] =
    useState<MembershipDocument | null>(null);
  const [deletingMembership, setDeletingMembership] =
    useState<MembershipDocument | null>(null);

  const deleteMembershipMutation = useDeleteMembership();

  // Filtered memberships
  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      // Status Filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      // Auto-Renew Filter
      if (renewFilter === 'true' && !m.autoRenew) return false;
      if (renewFilter === 'false' && m.autoRenew) return false;

      // Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const memberName = memberMap.get(m.memberId)?.toLowerCase() || '';
        const planName = planMap.get(m.planId)?.toLowerCase() || '';
        const branchName = branchMap.get(m.branchId)?.toLowerCase() || '';
        const matchId = m._id.toLowerCase().includes(query);
        const matchMember = m.memberId.toLowerCase().includes(query) || memberName.includes(query);
        const matchPlan = m.planId.toLowerCase().includes(query) || planName.includes(query);
        const matchBranch = m.branchId.toLowerCase().includes(query) || branchName.includes(query);

        return matchId || matchMember || matchPlan || matchBranch;
      }

      return true;
    });
  }, [memberships, statusFilter, renewFilter, searchTerm, memberMap, planMap, branchMap]);

  // Aggregate stats
  const metrics = useMemo(() => {
    const total = memberships.length;
    const active = memberships.filter((m) => m.status === 'active').length;
    const expired = memberships.filter((m) => m.status === 'expired').length;
    const cancelled = memberships.filter((m) => m.status === 'cancelled').length;
    const autoRenewCount = memberships.filter((m) => m.autoRenew).length;

    return { total, active, expired, cancelled, autoRenewCount };
  }, [memberships]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-gym-600" />
            Member Subscriptions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage active subscriptions, enroll members into plans, and handle cancellations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh memberships"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsEnrollOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Enroll Member
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Total Subscriptions
          </span>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? '...' : metrics.total}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-600">
            Active Subscriptions
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {isLoading ? '...' : metrics.active}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Expired Subscriptions
          </span>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {isLoading ? '...' : metrics.expired}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-red-600">
            Cancelled Subscriptions
          </span>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {isLoading ? '...' : metrics.cancelled}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, member, plan, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white text-gray-700 w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={renewFilter}
            onChange={(e) => setRenewFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white text-gray-700 w-full sm:w-auto"
          >
            <option value="all">All Renewals</option>
            <option value="true">Auto-Renew: On</option>
            <option value="false">Auto-Renew: Off</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading memberships...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Failed to load memberships
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {(error as any)?.message ||
                'An error occurred while fetching the subscription registry.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400 mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No memberships found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || renewFilter !== 'all'
                ? 'Try adjusting your search or filter options.'
                : 'Get started by enrolling a member into an active membership plan.'}
            </p>
            {!(searchTerm || statusFilter !== 'all' || renewFilter !== 'all') && (
              <button
                onClick={() => setIsEnrollOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Enroll Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Term Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Auto-Renew</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMemberships.map((m) => {
                  const memberName = memberMap.get(m.memberId);
                  const planName = planMap.get(m.planId);
                  const branchName = branchMap.get(m.branchId);

                  return (
                    <tr
                      key={m._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/members/${m.memberId}`}
                          className="font-medium text-gym-600 hover:text-gym-700 hover:underline flex items-center gap-1.5"
                        >
                          {memberName ? (
                            <span>{memberName}</span>
                          ) : (
                            <span className="font-mono text-xs">{m.memberId}</span>
                          )}
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          ID: {m._id.slice(-6)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/plans/${m.planId}`}
                          className="font-medium text-gray-800 hover:text-gym-600 hover:underline"
                        >
                          {planName || m.planId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {branchName || (
                          <span className="font-mono text-xs">{m.branchId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">
                          {m.startDate} <span className="text-gray-400 font-normal">to</span> {m.endDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(m.status)}</td>
                      <td className="py-3 px-4">
                        {m.autoRenew ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRenewingMembership(m)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="1-Click Renew Subscription"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/memberships/${m._id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {m.status === 'active' && (
                            <button
                              onClick={() => setCancellingMembership(m)}
                              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Cancel Subscription"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeletingMembership(m)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Subscription permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      <EnrollMemberModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
      />

      {/* Cancel Confirmation Modal */}
      <CancelMembershipModal
        isOpen={!!cancellingMembership}
        onClose={() => setCancellingMembership(null)}
        membership={cancellingMembership}
      />

      {/* 1-Click Renewal Modal */}
      {renewingMembership && (
        <RenewModal
          isOpen={!!renewingMembership}
          onClose={() => setRenewingMembership(null)}
          membershipId={renewingMembership._id}
          planName={planMap.get(renewingMembership.planId)}
          planPrice={plans.find((p) => p._id === renewingMembership.planId)?.price || 0}
          currentEndDate={renewingMembership.endDate}
          durationMonths={Math.max(1, Math.round((plans.find((p) => p._id === renewingMembership.planId)?.durationDays || 30) / 30))}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingMembership}
        onClose={() => setDeletingMembership(null)}
        onConfirm={async () => {
          if (deletingMembership) {
            await deleteMembershipMutation.mutateAsync(deletingMembership._id);
            setDeletingMembership(null);
          }
        }}
        title="Delete Membership Subscription"
        itemName={deletingMembership ? `ID: ${deletingMembership._id} (${planMap.get(deletingMembership.planId) || 'Plan'})` : ''}
        isLoading={deleteMembershipMutation.isPending}
      />
    </div>
  );
};
