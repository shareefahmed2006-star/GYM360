import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Trash2,
} from 'lucide-react';
import { usePayments, useDeletePayment } from '../../hooks/usePayments';
import { useMembers } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { RecordPaymentModal } from '../../components/payment/RecordPaymentModal';
import { UpdatePaymentStatusModal } from '../../components/payment/UpdatePaymentStatusModal';
import { InvoiceModal } from '../../components/payment/InvoiceModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { PaymentDocument, PaymentStatus } from '../../types/payment.types';

export const PaymentListPage: React.FC = () => {
  // Query Filters State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payments passing server-level filters where supported
  const apiFilters = useMemo(() => {
    const filters: {
      status?: string;
      paymentMethod?: string;
      branchId?: string;
    } = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (methodFilter !== 'all') filters.paymentMethod = methodFilter;
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    return filters;
  }, [statusFilter, methodFilter, branchFilter]);

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePayments(apiFilters);

  // Supplementary data for labels & human-readable linking
  const { data: members = [] } = useMembers();
  const { data: branches = [] } = useBranches();

  // Maps for efficient lookups
  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m._id, `${m.firstName} ${m.lastName}`]));
  }, [members]);

  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Client-side search filtering
  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const query = searchTerm.toLowerCase();

    return payments.filter((p) => {
      const matchTxn = p.transactionReference.toLowerCase().includes(query);
      const matchId = p._id.toLowerCase().includes(query);
      const matchMemberId = p.memberId.toLowerCase().includes(query);
      const matchSubId = p.membershipId.toLowerCase().includes(query);
      const memberName = memberMap.get(p.memberId)?.toLowerCase() || '';
      const matchMemberName = memberName.includes(query);

      return (
        matchTxn || matchId || matchMemberId || matchSubId || matchMemberName
      );
    });
  }, [payments, searchTerm, memberMap]);

  // Modals state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] =
    useState<PaymentDocument | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentDocument | null>(null);
  const [selectedPaymentForStatus, setSelectedPaymentForStatus] =
    useState<PaymentDocument | null>(null);
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('completed');

  const deletePaymentMutation = useDeletePayment();

  // Clipboard copy state for transaction references
  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTxn(text);
      setTimeout(() => setCopiedTxn(null), 2000);
    }
  };

  // Accurate Financial Metrics strictly calculated over loaded records
  const loadedMetrics = useMemo(() => {
    let grossCollected = 0;
    let pendingTotal = 0;
    let refundedTotal = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let failedCount = 0;

    for (const p of filteredPayments) {
      if (p.status === 'completed') {
        grossCollected += p.amount;
        completedCount++;
      } else if (p.status === 'pending') {
        pendingTotal += p.amount;
        pendingCount++;
      } else if (p.status === 'refunded') {
        refundedTotal += p.amount;
        refundedCount++;
      } else if (p.status === 'failed') {
        failedCount++;
      }
    }

    return {
      grossCollected,
      pendingTotal,
      refundedTotal,
      totalCount: filteredPayments.length,
      completedCount,
      pendingCount,
      refundedCount,
      failedCount,
    };
  }, [filteredPayments]);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCcw className="w-3 h-3" />
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            Failed
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

  const getMethodBadge = (method: string) => {
    const formatted = method.replace('_', ' ').toUpperCase();
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
        {formatted}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-gym-600" />
            Billing & Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track transactions, inspect revenue collection, and process verified payment adjustments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh payments"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsRecordOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Financial Metrics Summary (Strictly labeled as Loaded Records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-emerald-700">
            <span>Gross Collected</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {isLoading ? '...' : `$${loadedMetrics.grossCollected.toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loadedMetrics.completedCount} completed transaction
            {loadedMetrics.completedCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-amber-600">
            <span>Pending Balance</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {isLoading ? '...' : `$${loadedMetrics.pendingTotal.toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loadedMetrics.pendingCount} pending payment
            {loadedMetrics.pendingCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-purple-600">
            <span>Refunded Total</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {isLoading ? '...' : `$${loadedMetrics.refundedTotal.toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loadedMetrics.refundedCount} refunded record
            {loadedMetrics.refundedCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Transactions</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? '...' : loadedMetrics.totalCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {loadedMetrics.failedCount} failed record
            {loadedMetrics.failedCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, member, or subscription ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white text-gray-700"
          >
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white text-gray-700 max-w-[160px]"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Failed to load payments
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {(error as any)?.message ||
                'An error occurred while fetching payment records.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400 mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No payments found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm ||
              statusFilter !== 'all' ||
              methodFilter !== 'all' ||
              branchFilter !== 'all'
                ? 'Try adjusting your search criteria or active filters.'
                : 'No payments have been recorded yet. Click below to record a new transaction.'}
            </p>
            {!(
              searchTerm ||
              statusFilter !== 'all' ||
              methodFilter !== 'all' ||
              branchFilter !== 'all'
            ) && (
              <button
                onClick={() => setIsRecordOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => {
                  const memberName = memberMap.get(p.memberId);
                  const branchName = branchMap.get(p.branchId);

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-900">
                          <span>{p.transactionReference}</span>
                          <button
                            onClick={() =>
                              copyToClipboard(p.transactionReference)
                            }
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                            title="Copy Reference"
                          >
                            {copiedTxn === p.transactionReference ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          ID: {p._id.slice(-6)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/members/${p.memberId}`}
                          className="font-medium text-gym-600 hover:text-gym-700 hover:underline flex items-center gap-1"
                        >
                          <span>{memberName || p.memberId.slice(-8)}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <Link
                          to={`/admin/memberships/${p.membershipId}`}
                          className="text-xs text-gray-400 hover:text-gray-600 font-mono mt-0.5 block"
                        >
                          Sub: {p.membershipId.slice(-6)}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        {branchName || (
                          <span className="font-mono text-xs">{p.branchId}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          ${p.amount.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-4">{getMethodBadge(p.paymentMethod)}</td>

                      <td className="py-3 px-4 text-gray-700">{p.paymentDate}</td>

                      <td className="py-3 px-4">{getStatusBadge(p.status)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPaymentForInvoice(p)}
                            className="p-1.5 rounded-lg text-gym-600 hover:text-gym-700 hover:bg-gym-50 transition-colors"
                            title="Download / Print PDF Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/payments/${p._id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick Actions adhering to backend state machine */}
                          {p.status === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedPaymentForStatus(p);
                                setTargetStatus('refunded');
                              }}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Process Refund"
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </button>
                          )}
                          {p.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedPaymentForStatus(p);
                                setTargetStatus('completed');
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete transaction record permanently"
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

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
      />

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedPaymentForInvoice}
        onClose={() => setSelectedPaymentForInvoice(null)}
        payment={selectedPaymentForInvoice}
        memberName={selectedPaymentForInvoice ? memberMap.get(selectedPaymentForInvoice.memberId) : undefined}
        branchName={selectedPaymentForInvoice ? branchMap.get(selectedPaymentForInvoice.branchId) : undefined}
      />

      {/* Status Update & Refund Modal */}
      <UpdatePaymentStatusModal
        isOpen={!!selectedPaymentForStatus}
        onClose={() => setSelectedPaymentForStatus(null)}
        payment={selectedPaymentForStatus}
        targetStatus={targetStatus}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={async () => {
          if (deletingPayment) {
            await deletePaymentMutation.mutateAsync(deletingPayment._id);
            setDeletingPayment(null);
          }
        }}
        title="Delete Payment Transaction"
        itemName={deletingPayment ? `Ref: ${deletingPayment.transactionReference} ($${deletingPayment.amount.toFixed(2)})` : ''}
        isLoading={deletePaymentMutation.isPending}
      />
    </div>
  );
};
