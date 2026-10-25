import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useRenewMembership } from '../../hooks/useMemberships';

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  membershipId: string;
  planName?: string;
  planPrice?: number;
  currentEndDate?: string;
  durationMonths?: number;
  onRenewSuccess?: () => void;
}

export const RenewModal: React.FC<RenewModalProps> = ({
  isOpen,
  onClose,
  membershipId,
  planName = 'Membership Plan',
  planPrice = 0,
  currentEndDate = '',
  durationMonths = 1,
  onRenewSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [successData, setSuccessData] = useState<{
    newEndDate: string;
    invoiceNumber: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const renewMutation = useRenewMembership();

  if (!isOpen) return null;

  const handleRenew = async () => {
    setErrorMsg(null);
    try {
      const res = await renewMutation.mutateAsync({
        membershipId,
        paymentMethod,
      });

      setSuccessData({
        newEndDate: res.membership.endDate,
        invoiceNumber: (res.payment as any)?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      });

      if (onRenewSuccess) {
        onRenewSuccess();
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to renew membership.'
      );
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gym-500 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                1-Click Instant Renewal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extend your active gym privileges with zero downtime
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {successData ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Membership Successfully Renewed!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your plan is now active through{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {successData.newEndDate}
                  </span>
                  .
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/80 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="font-bold text-gym-600 dark:text-gym-400">
                    {successData.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-bold text-emerald-600">PAID & VERIFIED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valid Until:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {successData.newEndDate}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-gym-600 hover:bg-gym-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Renewal Plan Summary Card */}
              <div className="p-4 rounded-xl bg-linear-to-br from-gym-50 to-orange-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-gym-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gym-700 dark:text-gym-400 uppercase tracking-wider">
                      Selected Plan
                    </span>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      {planName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      ₹{planPrice.toFixed(2)}
                    </span>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Incl. 18% GST
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gym-200/60 dark:border-slate-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gym-600" />
                    Current Expiry: {currentEndDate || 'N/A'}
                  </span>
                  <span className="font-semibold text-gym-700 dark:text-gym-400 flex items-center gap-1">
                    Extend +{durationMonths * 30} Days
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-gym-600 bg-gym-50/60 dark:bg-gym-950/40 text-gym-900 dark:text-white ring-1 ring-gym-600'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-gym-100 dark:bg-gym-900/60 text-gym-600">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">UPI Instant</div>
                      <div className="text-[10px] text-gray-500">Google Pay / PhonePe</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-gym-600 bg-gym-50/60 dark:bg-gym-950/40 text-gym-900 dark:text-white ring-1 ring-gym-600'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-gym-100 dark:bg-gym-900/60 text-gym-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Debit / Credit Card</div>
                      <div className="text-[10px] text-gray-500">Visa / Mastercard</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Instant activation & printable tax receipt generated automatically</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gym-600 hover:bg-gym-700 text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {renewMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Renew</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
