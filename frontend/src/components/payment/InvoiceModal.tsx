import React, { useRef } from 'react';
import {
  X,
  Printer,
  Dumbbell,
  CheckCircle,
  FileText,
  Building,
  User,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { PaymentDocument } from '../../types/payment.types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDocument | null;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
  branchName?: string;
  planName?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  payment,
  memberName,
  memberEmail,
  memberPhone,
  branchName,
  planName,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  // Invoice Number derivation
  const invoiceNumber =
    (payment as any).invoiceNumber ||
    `INV-${payment.transactionReference.replace(/^GYM360-TXN-/, '').slice(0, 10).toUpperCase()}`;

  // Tax calculations (18% GST: 9% CGST + 9% SGST)
  const totalAmount = payment.amount || 0;
  const baseAmount = Number((totalAmount / 1.18).toFixed(2));
  const gstAmount = Number((totalAmount - baseAmount).toFixed(2));
  const halfGst = Number((gstAmount / 2).toFixed(2));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Print-specific style override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #gym360-printable-invoice, #gym360-printable-invoice * {
            visibility: visible;
          }
          #gym360-printable-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Header (Hidden during actual print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gym-600 text-white rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Tax Invoice & Official Receipt
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {invoiceNumber} &bull; Generated from GYM360 Billing System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          <div
            id="gym360-printable-invoice"
            ref={printRef}
            className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 space-y-8"
          >
            {/* Header: Brand & Invoice Meta */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gym-500 to-gym-700 flex items-center justify-center text-white shadow-md">
                  <Dumbbell className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                      GYM<span className="text-gym-600">360</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gym-50 dark:bg-gym-950/60 text-gym-700 dark:text-gym-400 border border-gym-200 dark:border-gym-800 rounded">
                      Official Tax Invoice
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Fitness & Wellness Management Network
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                    GSTIN: 29AABCU9603R1ZM &bull; SAC: 999723
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Paid & Verified</span>
                </div>
                <div className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                  {invoiceNumber}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Date: {payment.paymentDate}
                </div>
              </div>
            </div>

            {/* Billed From & Billed To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gym-600" />
                  Provider / Gym Branch
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  GYM360 {branchName ? `- ${branchName}` : 'Central Facility'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                  <p>100 Feet Road, Indiranagar</p>
                  <p>Bengaluru, Karnataka 560038, India</p>
                  <p>Email: billing@gym360.local | Tel: +91 (800) 496-3600</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gym-600" />
                  Billed To (Member)
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {memberName || `Member ID: ${payment.memberId.slice(-8)}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                  {memberEmail && <p>Email: {memberEmail}</p>}
                  {memberPhone && <p>Phone: {memberPhone}</p>}
                  <p className="font-mono text-[11px] text-gray-400">
                    Membership ID: {payment.membershipId}
                  </p>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Taxable Value</th>
                    <th className="py-3 px-4 text-right">CGST (9%)</th>
                    <th className="py-3 px-4 text-right">SGST (9%)</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {planName || 'Fitness Membership Subscription'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Gym facility access, trainer guidance & fitness equipment usage
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">1</td>
                    <td className="py-4 px-4 text-right font-mono">₹{baseAmount.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-mono">₹{halfGst.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-mono">₹{halfGst.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-bold font-mono text-gray-900 dark:text-white">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Summary & Transaction Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Payment Info */}
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gym-600" />
                  Payment Details
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-800 py-1">
                  <span>Payment Method:</span>
                  <span className="font-semibold uppercase text-gray-900 dark:text-gray-100">
                    {payment.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-800 py-1">
                  <span>Transaction Reference:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {payment.transactionReference}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-800 py-1">
                  <span>Payment Status:</span>
                  <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                    {payment.status}
                  </span>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 text-sm border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">₹{baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>CGST (9.0%):</span>
                  <span className="font-mono">₹{halfGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>SGST (9.0%):</span>
                  <span className="font-mono">₹{halfGst.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between font-bold text-base text-gray-900 dark:text-white">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-gym-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice & Stamp */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 dark:text-gray-500 gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>
                  This is a computer-generated tax receipt and invoice. No physical signature is required.
                </span>
              </div>
              <div className="font-mono text-[11px]">
                GYM360 Systems &bull; Printed {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
