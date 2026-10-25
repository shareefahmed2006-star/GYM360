import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCcw,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { usePayment } from '../../hooks/usePayments';
import { useMember } from '../../hooks/useMembers';
import { useMembership } from '../../hooks/useMemberships';
import { useMembershipPlan } from '../../hooks/useMembershipPlans';
import { useBranch } from '../../hooks/useBranches';
import { UpdatePaymentStatusModal } from '../../components/payment/UpdatePaymentStatusModal';
import { InvoiceModal } from '../../components/payment/InvoiceModal';
import { PaymentStatus } from '../../types/payment.types';

export const PaymentDetailPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  const {
    data: payment,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePayment(paymentId);

  // Fetch associated records using payment identifiers
  const { data: member } = useMember(payment?.memberId);
  const { data: membership } = useMembership(payment?.membershipId);
  const { data: plan } = useMembershipPlan(membership?.planId);
  const { data: branch } = useBranch(payment?.branchId);

  // Status transition modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('completed');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Clipboard copy state
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading payment details...</p>
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Payment Record Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested payment record could not be found or you do not have permission to view it.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/payments')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Payments
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

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCcw className="w-3.5 h-3.5" />
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Failed
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

  const openStatusModal = (status: PaymentStatus) => {
    setTargetStatus(status);
    setIsStatusModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/payments"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </Link>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          title="Refresh transaction"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Main Transaction Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              ${payment.amount.toFixed(2)}
            </h1>
            {getStatusBadge(payment.status)}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-500">Reference:</span>
            <code className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
              {payment.transactionReference}
            </code>
            <button
              onClick={() => copyToClipboard(payment.transactionReference)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
              title="Copy Transaction Reference"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Permitted State Machine Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            title="Download or Print PDF Tax Invoice"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF Invoice</span>
          </button>

          {payment.status === 'completed' && (
            <button
              onClick={() => openStatusModal('refunded')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Process Refund
            </button>
          )}

          {payment.status === 'pending' && (
            <>
              <button
                onClick={() => openStatusModal('completed')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Completed
              </button>
              <button
                onClick={() => openStatusModal('failed')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Mark Failed
              </button>
            </>
          )}

          {(payment.status === 'refunded' || payment.status === 'failed') && (
            <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">
              Terminal State (No further actions permitted)
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment & Transaction Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-semibold text-base">
            <DollarSign className="w-5 h-5 text-gym-600" />
            <h3>Transaction Information</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Gross Amount</span>
              <span className="font-bold text-gray-900 text-base">
                ${payment.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-semibold text-gray-900 uppercase">
                {payment.paymentMethod.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Transaction Date</span>
              <span className="font-medium text-gray-800">
                {payment.paymentDate}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Payment ID</span>
              <span className="font-mono text-xs text-gray-500">
                {payment._id}
              </span>
            </div>
          </div>
        </div>

        {/* Member Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <User className="w-5 h-5 text-gym-600" />
              <h3>Subscriber (Payer)</h3>
            </div>
            <Link
              to={`/admin/members/${payment.memberId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Full Name</span>
              <span className="font-semibold text-gray-900">
                {member ? `${member.firstName} ${member.lastName}` : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Email Address</span>
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
                {payment.memberId}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Membership Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <CreditCard className="w-5 h-5 text-gym-600" />
              <h3>Associated Subscription</h3>
            </div>
            <Link
              to={`/admin/memberships/${payment.membershipId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
            >
              <span>View Subscription</span>
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
              <span className="text-gray-500">Subscription Status</span>
              <span className="capitalize font-medium text-gray-800">
                {membership?.status || '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Coverage Term</span>
              <span className="text-gray-700">
                {membership
                  ? `${membership.startDate} to ${membership.endDate}`
                  : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Subscription ID</span>
              <span className="font-mono text-xs text-gray-500">
                {payment.membershipId}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Details Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
              <Building2 className="w-5 h-5 text-gym-600" />
              <h3>Assigned Branch</h3>
            </div>
            <Link
              to={`/admin/branches/${payment.branchId}`}
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
              <span className="text-gray-500">Branch Location</span>
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
                {payment.branchId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Transition & Refund Modal */}
      <UpdatePaymentStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        payment={payment}
        targetStatus={targetStatus}
      />

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        payment={payment}
        memberName={member ? `${member.firstName} ${member.lastName}` : undefined}
        memberEmail={member?.email}
        memberPhone={member?.phone}
        branchName={branch?.name}
        planName={plan?.name}
      />
    </div>
  );
};
