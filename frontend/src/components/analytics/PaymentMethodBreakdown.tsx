import React from 'react';
import { RevenueByMethod } from '../../types/analytics.types';
import { Banknote, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface PaymentMethodBreakdownProps {
  methods: {
    cash: RevenueByMethod;
    card: RevenueByMethod;
    upi: RevenueByMethod;
    bank_transfer: RevenueByMethod;
  };
  totalGross: number;
  formatCurrency: (val: number) => string;
}

export const PaymentMethodBreakdown: React.FC<PaymentMethodBreakdownProps> = ({
  methods,
  totalGross,
  formatCurrency,
}) => {
  const methodItems = [
    { key: 'cash', label: 'Cash', icon: Banknote, data: methods.cash, color: 'bg-emerald-500' },
    { key: 'card', label: 'Card', icon: CreditCard, data: methods.card, color: 'bg-blue-500' },
    { key: 'upi', label: 'UPI / Digital', icon: Smartphone, data: methods.upi, color: 'bg-purple-500' },
    { key: 'bank_transfer', label: 'Bank Transfer', icon: Building2, data: methods.bank_transfer, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-4">
      {methodItems.map(({ key, label, icon: Icon, data, color }) => {
        const sharePercent = totalGross > 0 ? (data.gross / totalGross) * 100 : 0;

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span>{label}</span>
                <span className="text-gray-400 font-normal">
                  ({data.completedCount} completed{data.refundedCount > 0 ? `, ${data.refundedCount} ref` : ''})
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-gray-900">{formatCurrency(data.gross)}</span>
                <span className="text-gray-400 w-10 text-right">{sharePercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${color}`}
                style={{ width: `${sharePercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
