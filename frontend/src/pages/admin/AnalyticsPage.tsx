import React, { useState, useMemo } from 'react';
import {
  useDashboardAnalytics,
  useRevenueAnalytics,
  useAttendanceAnalytics,
  useRetentionAnalytics,
} from '../../hooks/useAnalytics';
import { useBranches } from '../../hooks/useBranches';
import { ExecutiveKpiGrid } from '../../components/analytics/ExecutiveKpiGrid';
import { RevenueTrendChart } from '../../components/analytics/RevenueTrendChart';
import { RetentionCohortBreakdown } from '../../components/analytics/RetentionCohortBreakdown';
import { AttendanceFlowSection } from '../../components/analytics/AttendanceFlowSection';
import { PaymentMethodBreakdown } from '../../components/analytics/PaymentMethodBreakdown';
import {
  ShieldCheck,
  RefreshCw,
  Building2,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  Users,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

type AnalyticsTab = 'overview' | 'revenue' | 'attendance' | 'retention';

export const AnalyticsPage: React.FC = () => {
  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  // 2. Branch Filter State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { data: branches = [] } = useBranches();

  // Selected branch object for name/capacity lookup
  const selectedBranch = useMemo(() => {
    return branches.find((b) => b._id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Branch parameter to pass to queries (undefined = All Branches)
  const branchParam = selectedBranchId ? selectedBranchId : undefined;

  // 3. Date States
  const todayUtc = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const mtdStartUtc = useMemo(() => `${todayUtc.slice(0, 7)}-01`, [todayUtc]);

  // Revenue date range state (defaults to MTD)
  const [revenueStartDate, setRevenueStartDate] = useState<string>(mtdStartUtc);
  const [revenueEndDate, setRevenueEndDate] = useState<string>(todayUtc);
  const [revenueDateError, setRevenueDateError] = useState<string | null>(null);

  // Attendance date state (defaults to today)
  const [attendanceDate, setAttendanceDate] = useState<string>(todayUtc);

  // Retention horizon state (defaults to 30)
  const [retentionDaysAhead, setRetentionDaysAhead] = useState<number>(30);

  // Currency formatter
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Safe revenue query parameters: never submit only one parameter
  const validatedRevenueParams = useMemo(() => {
    if (revenueStartDate && revenueEndDate && revenueStartDate <= revenueEndDate) {
      return { startDate: revenueStartDate, endDate: revenueEndDate };
    }
    // Default to MTD if invalid or partial
    return { startDate: mtdStartUtc, endDate: todayUtc };
  }, [revenueStartDate, revenueEndDate, mtdStartUtc, todayUtc]);

  // Date range preset handlers
  const applyDatePreset = (preset: 'mtd' | '7d' | '30d') => {
    setRevenueDateError(null);
    if (preset === 'mtd') {
      setRevenueStartDate(mtdStartUtc);
      setRevenueEndDate(todayUtc);
    } else if (preset === '7d') {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 6);
      setRevenueStartDate(d.toISOString().slice(0, 10));
      setRevenueEndDate(todayUtc);
    } else if (preset === '30d') {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 29);
      setRevenueStartDate(d.toISOString().slice(0, 10));
      setRevenueEndDate(todayUtc);
    }
  };

  // Validate custom date change
  const handleStartDateChange = (newStart: string) => {
    setRevenueStartDate(newStart);
    if (newStart > revenueEndDate) {
      setRevenueDateError('Start date cannot be after end date.');
    } else {
      setRevenueDateError(null);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setRevenueEndDate(newEnd);
    if (revenueStartDate > newEnd) {
      setRevenueDateError('Start date cannot be after end date.');
    } else {
      setRevenueDateError(null);
    }
  };

  // 4. TanStack Query Hooks (consistently passing branchParam)
  const dashboardQuery = useDashboardAnalytics(branchParam);
  const revenueQuery = useRevenueAnalytics(
    validatedRevenueParams.startDate,
    validatedRevenueParams.endDate,
    branchParam
  );
  const attendanceQuery = useAttendanceAnalytics(attendanceDate, branchParam);
  const retentionQuery = useRetentionAnalytics(retentionDaysAhead, branchParam);

  const isAnyFetching =
    dashboardQuery.isFetching ||
    revenueQuery.isFetching ||
    attendanceQuery.isFetching ||
    retentionQuery.isFetching;

  const handleRefreshAll = () => {
    dashboardQuery.refetch();
    revenueQuery.refetch();
    attendanceQuery.refetch();
    retentionQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* 1. Master Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
              <ShieldCheck className="w-4 h-4" />
              Executive Analytics & Facility Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Cross-pillar performance metrics, financial cashflow, occupancy dynamics, and member retention.
            </p>
          </div>

          {/* Global Controls: Branch Selector & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
              <select
                aria-label="Filter by branch"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent border-0 font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
              >
                <option value="">All Branches (Organization-Wide)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshAll}
              disabled={isAnyFetching}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnyFetching ? 'animate-spin text-gym-600' : ''}`} />
              {isAnyFetching ? 'Refreshing Data...' : 'Sync Metrics'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-100 pt-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-gym-600 text-gym-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Executive Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'border-gym-600 text-gym-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Financial & Revenue
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-gym-600 text-gym-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Facility Occupancy & Flow
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('retention')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'retention'
                ? 'border-gym-600 text-gym-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Retention & Renewals
          </button>
        </div>
      </div>

      {/* Scope Pill Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
        <span>Current Active Scope:</span>
        <span className="font-semibold text-gym-800 bg-gym-50 border border-gym-200 px-2.5 py-0.5 rounded-full">
          {selectedBranch ? `Branch: ${selectedBranch.name}` : 'All Branches (Tenant Consolidated)'}
        </span>
      </div>

      {/* 2. TAB CONTENT: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {dashboardQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 h-32" />
              ))}
            </div>
          ) : dashboardQuery.isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-red-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Failed to load Executive KPI summary.</span>
              </div>
              <button
                onClick={() => dashboardQuery.refetch()}
                className="font-bold underline hover:text-red-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : dashboardQuery.data ? (
            <ExecutiveKpiGrid
              data={dashboardQuery.data}
              formatCurrency={formatCurrency}
            />
          ) : null}

          {/* Supporting Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Financial Overview */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Month-to-Date Revenue Stream
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {mtdStartUtc} to {todayUtc}
                </span>
              </div>

              {revenueQuery.data && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center font-mono">
                    <div>
                      <span className="text-[11px] text-gray-500 block font-sans">Gross Total</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {formatCurrency(revenueQuery.data.grossRevenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block font-sans">Refunds</span>
                      <span className="text-xs sm:text-sm font-bold text-red-600">
                        -{formatCurrency(revenueQuery.data.refundedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block font-sans">Net Collected</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700">
                        {formatCurrency(revenueQuery.data.netRevenue)}
                      </span>
                    </div>
                  </div>

                  <PaymentMethodBreakdown
                    methods={revenueQuery.data.byPaymentMethod}
                    totalGross={revenueQuery.data.grossRevenue}
                    formatCurrency={formatCurrency}
                  />
                </div>
              )}
            </div>

            {/* Quick Retention Overview */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Upcoming Membership Expirations
                </h3>
                <span className="text-xs text-gray-400">Next 30 Days</span>
              </div>

              {retentionQuery.data && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 text-center">
                      <span className="text-[11px] font-bold text-red-800 block">Critical (1–7d)</span>
                      <span className="text-xl font-extrabold text-red-900 font-mono mt-1 block">
                        {retentionQuery.data.expiringBuckets.within7Days}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-center">
                      <span className="text-[11px] font-bold text-amber-800 block">Upcoming (8–14d)</span>
                      <span className="text-xl font-extrabold text-amber-900 font-mono mt-1 block">
                        {retentionQuery.data.expiringBuckets.between8And14Days}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-center">
                      <span className="text-[11px] font-bold text-blue-800 block">Horizon (15–30d)</span>
                      <span className="text-xl font-extrabold text-blue-900 font-mono mt-1 block">
                        {retentionQuery.data.expiringBuckets.between15And30Days}
                      </span>
                    </div>
                  </div>

                  {/* Active Plans Preview */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Active Plan Distribution
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {retentionQuery.data.planDistribution.map((p) => (
                        <div
                          key={p.planId}
                          className="px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs flex items-center gap-1.5"
                        >
                          <span className="text-gray-700 font-medium">{p.planName}:</span>
                          <span className="font-bold text-gym-700 font-mono">{p.activeCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: FINANCIAL & REVENUE */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
          {/* Header & Date Range Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Financial Performance & Cashflow Intelligence
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Completed gross receipts, processed refunds, net revenue, and daily trends.
              </p>
            </div>

            {/* Presets and Custom Range */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
                <button
                  type="button"
                  onClick={() => applyDatePreset('mtd')}
                  className="px-2.5 py-1 rounded-md font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  MTD
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('7d')}
                  className="px-2.5 py-1 rounded-md font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('30d')}
                  className="px-2.5 py-1 rounded-md font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Last 30 Days
                </button>
              </div>

              {/* Custom Date Pickers */}
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={revenueStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-transparent border-0 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
                />
                <span className="text-gray-400 font-sans">to</span>
                <input
                  type="date"
                  value={revenueEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="bg-transparent border-0 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Date Validation Alert if any */}
          {revenueDateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{revenueDateError} (reverting query to valid Month-to-Date range).</span>
            </div>
          )}

          {revenueQuery.isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="h-44 bg-gray-100 rounded-xl" />
            </div>
          ) : revenueQuery.isError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
              <span>Failed to load financial revenue analytics.</span>
              <button
                onClick={() => revenueQuery.refetch()}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : revenueQuery.data ? (
            <div className="space-y-6">
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Gross Collections
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-gray-900 font-mono mt-0.5 block">
                    {formatCurrency(revenueQuery.data.grossRevenue)}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {revenueQuery.data.completedCount} completed transactions
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Refund Impact
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-red-600 font-mono mt-0.5 block">
                    -{formatCurrency(revenueQuery.data.refundedAmount)}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {revenueQuery.data.refundedCount} refund payments
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Net Realized Revenue
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono mt-0.5 block">
                    {formatCurrency(revenueQuery.data.netRevenue)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Gross minus refunds
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Active Window
                  </span>
                  <span className="text-xs font-bold text-gray-800 font-mono mt-1 block">
                    {revenueQuery.data.startDate}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    to {revenueQuery.data.endDate}
                  </span>
                </div>
              </div>

              {/* Payment Method Split */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment Method Distribution
                </h4>
                <PaymentMethodBreakdown
                  methods={revenueQuery.data.byPaymentMethod}
                  totalGross={revenueQuery.data.grossRevenue}
                  formatCurrency={formatCurrency}
                />
              </div>

              {/* Daily Trend Visualizer */}
              <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <RevenueTrendChart
                  timeSeries={revenueQuery.data.timeSeries}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 4. TAB CONTENT: ATTENDANCE & FACILITY OCCUPANCY */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
          {attendanceQuery.isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-44 bg-gray-100 rounded-xl" />
            </div>
          ) : attendanceQuery.isError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
              <span>Failed to load facility attendance analytics.</span>
              <button
                onClick={() => attendanceQuery.refetch()}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : attendanceQuery.data ? (
            <AttendanceFlowSection
              data={attendanceQuery.data}
              selectedDate={attendanceDate}
              onDateChange={setAttendanceDate}
              selectedBranchName={selectedBranch?.name}
            />
          ) : null}
        </div>
      )}

      {/* 5. TAB CONTENT: RETENTION & RENEWALS */}
      {activeTab === 'retention' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
          {retentionQuery.isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-44 bg-gray-100 rounded-xl" />
            </div>
          ) : retentionQuery.isError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
              <span>Failed to load membership retention analytics.</span>
              <button
                onClick={() => retentionQuery.refetch()}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : retentionQuery.data ? (
            <RetentionCohortBreakdown
              data={retentionQuery.data}
              selectedDaysAhead={retentionDaysAhead}
              onSelectDaysAhead={setRetentionDaysAhead}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
