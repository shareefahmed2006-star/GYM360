import React from 'react';
import { MembershipRetentionResponse } from '../../types/analytics.types';
import {
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  Archive,
  Info,
} from 'lucide-react';

interface RetentionCohortBreakdownProps {
  data: MembershipRetentionResponse;
  selectedDaysAhead: number;
  onSelectDaysAhead: (days: number) => void;
}

export const RetentionCohortBreakdown: React.FC<RetentionCohortBreakdownProps> = ({
  data,
  selectedDaysAhead,
  onSelectDaysAhead,
}) => {
  const {
    expiringBuckets,
    cumulativeExpiring,
    totalExpiringInWindow,
    currentlyActiveCount,
    staleActiveCount,
    historicalExpiredCount,
    historicalCancelledCount,
    planDistribution,
    horizonDays,
  } = data;

  const horizonOptions = [7, 14, 30, 60, 90];

  return (
    <div className="space-y-6">
      {/* 1. Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gym-700" />
            Membership Retention & Expiration Cohorts
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Active membership renewals, expiration buckets, and plan distribution.
          </p>
        </div>

        {/* Horizon daysAhead filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="horizon-select" className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Horizon Target:
          </label>
          <select
            id="horizon-select"
            value={selectedDaysAhead}
            onChange={(e) => onSelectDaysAhead(Number(e.target.value))}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-gym-500 cursor-pointer"
          >
            {horizonOptions.map((days) => (
              <option key={days} value={days}>
                {days} Days Window
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Stale Active Memberships Notice if present */}
      {staleActiveCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Stale Active Subscriptions Detected ({staleActiveCount}):</span>
            <p className="text-amber-700 mt-0.5">
              These records are marked as &ldquo;active&rdquo; in the database but have an end date that has already passed. The retention metrics strictly exclude them from currently active counts.
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Expiration Cohort Buckets (Mutually Exclusive) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            30-Day Critical Renewal Cohorts
          </span>
          <span className="text-[11px] text-gray-400">
            Mutually exclusive upcoming windows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Critical: 1 to 7 Days */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800">Critical: 1 to 7 Days</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="text-3xl font-extrabold text-red-900 mt-2 font-mono">
              {expiringBuckets.within7Days}
            </div>
            <p className="text-[11px] text-red-700 mt-1">
              Urgent renewal intervention required.
            </p>
          </div>

          {/* Upcoming: 8 to 14 Days */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Upcoming: 8 to 14 Days</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-900 mt-2 font-mono">
              {expiringBuckets.between8And14Days}
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Renewal reminder outreach window.
            </p>
          </div>

          {/* Horizon: 15 to 30 Days */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Horizon: 15 to 30 Days</span>
            </div>
            <div className="text-3xl font-extrabold text-blue-900 mt-2 font-mono">
              {expiringBuckets.between15And30Days}
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Standard renewal pipeline queue.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Cumulative Rollups & Target Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cumulative Expirations */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Cumulative Expirations
            </span>
            <span className="text-[11px] text-gray-400">Running Totals</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
              <span className="text-gray-600">Expiring within 7 Days</span>
              <span className="font-bold text-gray-900 font-mono">
                {cumulativeExpiring.expiringIn7Days}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
              <span className="text-gray-600">Expiring within 14 Days</span>
              <span className="font-bold text-gray-900 font-mono">
                {cumulativeExpiring.expiringIn14Days}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
              <span className="text-gray-600">Expiring within 30 Days</span>
              <span className="font-bold text-gym-700 font-mono">
                {cumulativeExpiring.expiringIn30Days}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Horizon Metrics & Churn Context */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gray-500" />
                Target Horizon ({horizonDays}d) Summary
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Total Expiring in {horizonDays}-Day Horizon:</span>
                <span className="font-bold text-gray-900 font-mono text-sm">
                  {totalExpiringInWindow}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Active Membership Base:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {currentlyActiveCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Archive className="w-3 h-3 text-gray-400" />
              Historical Churn:
            </span>
            <div className="flex items-center gap-3">
              <span>{historicalExpiredCount} Expired</span>
              <span>·</span>
              <span>{historicalCancelledCount} Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Active Plan Distribution */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            Active Plan Distribution ({planDistribution.length} configured plans)
          </h4>
        </div>

        {planDistribution.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
            No active memberships recorded in this scope.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {planDistribution.map((plan) => {
              const share = currentlyActiveCount > 0 ? (plan.activeCount / currentlyActiveCount) * 100 : 0;

              return (
                <div
                  key={plan.planId}
                  className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800 truncate mr-2" title={plan.planName}>
                      {plan.planName}
                    </span>
                    <span className="text-xs font-bold text-gym-700 font-mono bg-gym-50 px-2 py-0.5 rounded border border-gym-100 shrink-0">
                      {plan.activeCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gym-600 h-full rounded-full"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block text-right font-mono">
                    {share.toFixed(1)}% of active
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
