import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useMembership } from '../../hooks/useMemberships';
import { useMember } from '../../hooks/useMembers';
import { useMembershipPlan } from '../../hooks/useMembershipPlans';
import { useBranch } from '../../hooks/useBranches';
import { CancelMembershipModal } from '../../components/membership/CancelMembershipModal';

export const MembershipDetailPage: React.FC = () => {
  const { membershipId } = useParams<{ membershipId: string }>();
  const navigate = useNavigate();

  const {
    data: membership,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMembership(membershipId);

  // Fetch related records using membership details
  const { data: member } = useMember(membership?.memberId);
  const { data: plan } = useMembershipPlan(membership?.planId);
  const { data: branch } = useBranch(membership?.branchId);

  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Calculate days remaining safely
  const daysRemaining = React.useMemo(() => {
    if (!membership?.endDate) return null;
    const end = new Date(membership.endDate + 'T23:59:59Z');
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [membership?.endDate]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading subscription details...</p>
      </div>
    );
  }

  if (isError || !membership) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Membership Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested membership subscription could not be retrieved.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/memberships')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Directory
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <Clock className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/memberships"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </Link>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          title="Refresh record"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Subscription #{membership._id.slice(-8)}
            </h1>
            {getStatusBadge(membership.status)}
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Full ID: {membership._id}
          </p>
        </div>

        {membership.status === 'active' && (
          <button
            onClick={() => setIsCancelOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Ban className="w-4 h-4" />
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Term & Lifecycle Information */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-semibold text-base">
            <Calendar className="w-5 h-5 text-gym-600" />
            <h3>Term & Lifecycle</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Start Date</span>
              <span className="font-semibold text-gray-900">
                {membership.startDate}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">End Date</span>
              <span className="font-semibold text-gray-900">
                {membership.endDate}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Validity Remaining</span>
              <span>
                {membership.status === 'active' ? (
                  daysRemaining !== null && daysRemaining >= 0 ? (
                    <span className="font-semibold text-emerald-700">
                      {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Ending today</span>
                  )
                ) : (
                  <span className="text-gray-400">Not active</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Automatic Renewal</span>
              <span>
                {membership.autoRenew ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                    Disabled
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Member Associated Profile */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <User className="w-5 h-5 text-gym-600" />
              <h3>Subscriber Information</h3>
            </div>
            <Link
              to={`/admin/members/${membership.memberId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Name</span>
              <span className="font-semibold text-gray-900">
                {member ? `${member.firstName} ${member.lastName}` : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-700">{member?.email || '...'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Member Status</span>
              <span className="capitalize font-medium text-gray-800">
                {member?.status || '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Member ID</span>
              <span className="font-mono text-xs text-gray-500">
                {membership.memberId}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Associated Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <CreditCard className="w-5 h-5 text-gym-600" />
              <h3>Membership Plan</h3>
            </div>
            <Link
              to={`/admin/plans/${membership.planId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
            >
              <span>View Plan</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Plan Name</span>
              <span className="font-semibold text-gray-900">
                {plan?.name || '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Pricing</span>
              <span className="font-semibold text-gray-900">
                {plan ? `$${plan.price}` : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Plan Duration</span>
              <span className="text-gray-700">
                {plan ? `${plan.durationDays} days` : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Branch Access Tier</span>
              <span className="capitalize font-medium text-gray-800">
                {plan ? plan.branchAccess.replace('_', ' ') : '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Associated Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <Building2 className="w-5 h-5 text-gym-600" />
              <h3>Branch Assignment</h3>
            </div>
            <Link
              to={`/admin/branches/${membership.branchId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
            >
              <span>View Branch</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Branch Name</span>
              <span className="font-semibold text-gray-900">
                {branch?.name || '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Location</span>
              <span className="text-gray-700">
                {branch
                  ? `${branch.address.city}, ${branch.address.state}`
                  : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Branch Status</span>
              <span className="capitalize font-medium text-gray-800">
                {branch?.status || '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Branch ID</span>
              <span className="font-mono text-xs text-gray-500">
                {membership.branchId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <CancelMembershipModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        membership={membership}
      />
    </div>
  );
};
