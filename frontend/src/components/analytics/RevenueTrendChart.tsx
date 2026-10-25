import React, { useState } from 'react';
import { DailyRevenueItem } from '../../types/analytics.types';
import { BarChart3, Table, Info } from 'lucide-react';

interface RevenueTrendChartProps {
  timeSeries: DailyRevenueItem[];
  formatCurrency: (val: number) => string;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  timeSeries,
  formatCurrency,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Ensure chronological order
  const sortedSeries = [...timeSeries].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedSeries.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-gray-600">No Revenue Data in Selected Range</p>
        <p className="text-[11px] text-gray-400 mt-1">
          No completed or refunded transactions occurred during this date window.
        </p>
      </div>
    );
  }

  // Calculate highest gross revenue for scaling bars safely
  const maxGross = Math.max(...sortedSeries.map((d) => d.grossRevenue), 1);

  return (
    <div className="space-y-4">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Info className="w-3.5 h-3.5 text-gray-400" />
          <span>Daily Cashflow Trend ({sortedSeries.length} recorded day{sortedSeries.length > 1 ? 's' : ''})</span>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-white text-gym-700 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Chart
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-gym-700 shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Table
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-3">
          {/* Bar Chart Container */}
          <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
            {sortedSeries.map((item) => {
              const heightPercent = maxGross > 0 ? (item.grossRevenue / maxGross) * 100 : 0;
              const hasRefund = item.refundedAmount > 0;

              return (
                <div
                  key={item.date}
                  className="flex-1 min-w-[20px] max-w-[48px] flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Hover Tooltip */}
                  <div className="absolute -top-16 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                    <p className="font-semibold text-gray-200">{item.date}</p>
                    <p className="text-emerald-400">Net: {formatCurrency(item.netRevenue)}</p>
                    <p className="text-gray-300">
                      Gross: {formatCurrency(item.grossRevenue)} ({item.completedCount} paid)
                    </p>
                    {hasRefund && (
                      <p className="text-red-300">
                        Refund: -{formatCurrency(item.refundedAmount)} ({item.refundedCount} ref)
                      </p>
                    )}
                  </div>

                  {/* Visual Bar */}
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className={`w-full rounded-t transition-all ${
                      item.grossRevenue > 0
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : 'bg-gray-100'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Date Axis Labels */}
          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
            <span>{sortedSeries[0]?.date}</span>
            {sortedSeries.length > 2 && (
              <span>{sortedSeries[Math.floor(sortedSeries.length / 2)]?.date}</span>
            )}
            <span>{sortedSeries[sortedSeries.length - 1]?.date}</span>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-[11px] text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              Daily Gross Collection
            </span>
          </div>
        </div>
      ) : (
        /* Tabular Breakdown View */
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Gross</th>
                  <th className="py-2 px-3 text-right">Refunds</th>
                  <th className="py-2 px-3 text-right">Net Revenue</th>
                  <th className="py-2 px-3 text-center">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSeries.map((item) => (
                  <tr key={item.date} className="hover:bg-gray-50 font-mono">
                    <td className="py-2 px-3 text-gray-900 font-medium font-sans">{item.date}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.grossRevenue)}</td>
                    <td className="py-2 px-3 text-right text-red-600">
                      {item.refundedAmount > 0 ? `-${formatCurrency(item.refundedAmount)}` : '₹0'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(item.netRevenue)}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-500 text-[11px]">
                      {item.completedCount} completed{item.refundedCount > 0 ? `, ${item.refundedCount} refunded` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
