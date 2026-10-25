import React from 'react';
import {
  useDashboardAnalytics,
  useRevenueAnalytics,
  useAttendanceAnalytics,
  useRetentionAnalytics,
} from '../../hooks/useAnalytics';
import { KpiCard } from '../../components/analytics/KpiCard';
import { HourlyAttendanceChart } from '../../components/analytics/HourlyAttendanceChart';
import { PaymentMethodBreakdown } from '../../components/analytics/PaymentMethodBreakdown';
import {
  DollarSign,
  Users,
  CalendarCheck,
  Dumbbell,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {

  // 4 Independent TanStack Query hooks
  const dashboardQuery = useDashboardAnalytics();
  const revenueQuery = useRevenueAnalytics();
  const attendanceQuery = useAttendanceAnalytics();
  const retentionQuery = useRetentionAnalytics();

  // Currency Formatter (Defaults to INR as tested in GYM360 seed data)
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRefreshAll = () => {
    dashboardQuery.refetch();
    revenueQuery.refetch();
    attendanceQuery.refetch();
    retentionQuery.refetch();
  };

  const isAnyFetching =
    dashboardQuery.isFetching ||
    revenueQuery.isFetching ||
    attendanceQuery.isFetching ||
    retentionQuery.isFetching;

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            Executive Analytics Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard & Operations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tenant-wide real-time KPIs, financial revenue metrics, and attendance distribution.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isAnyFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnyFetching ? 'animate-spin text-gym-600' : ''}`} />
          {isAnyFetching ? 'Syncing Metrics...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* 2. Executive KPI Summary Cards (Backed by GET /api/analytics/dashboard) */}
      <section aria-label="Executive KPI Overview">
        {dashboardQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs h-32 animate-pulse" />
            ))}
          </div>
        ) : dashboardQuery.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-red-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Failed to load Executive KPI summary.</span>
            </div>
            <button
              onClick={() => dashboardQuery.refetch()}
              className="text-xs font-bold underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        ) : dashboardQuery.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Net Revenue (MTD)"
              value={formatCurrency(dashboardQuery.data.revenue.mtd.netRevenue)}
              subtitle={`Gross: ${formatCurrency(dashboardQuery.data.revenue.mtd.grossRevenue)}`}
              icon={DollarSign}
              color="green"
              badge={{
                text: `${dashboardQuery.data.revenue.mtd.completedCount} Payments`,
                variant: 'success',
              }}
            />

            <KpiCard
              title="Active Members"
              value={dashboardQuery.data.members.currentlyActive}
              subtitle={`${dashboardQuery.data.members.totalRegistered} registered total`}
              icon={Users}
              color="blue"
              badge={{
                text: `${dashboardQuery.data.members.expiringIn30Days} expiring soon`,
                variant: dashboardQuery.data.members.expiringIn30Days > 0 ? 'warning' : 'neutral',
              }}
            />

            <KpiCard
              title="Today's Check-Ins"
              value={dashboardQuery.data.attendance.todayCheckIns}
              subtitle={`${dashboardQuery.data.attendance.currentlyCheckedIn} currently inside facility`}
              icon={CalendarCheck}
              color="purple"
              badge={{
                text: `${dashboardQuery.data.attendance.currentlyCheckedIn} Active Flow`,
                variant: 'info',
              }}
            />

            <KpiCard
              title="Equipment Health"
              value={`${dashboardQuery.data.equipment.operationalPercentage.toFixed(1)}%`}
              subtitle={`${dashboardQuery.data.equipment.operational} of ${dashboardQuery.data.equipment.total} operational`}
              icon={Dumbbell}
              color="amber"
              badge={{
                text: `${dashboardQuery.data.equipment.underMaintenance + dashboardQuery.data.equipment.outOfService} Attention`,
                variant: dashboardQuery.data.equipment.underMaintenance > 0 ? 'warning' : 'neutral',
              }}
            />
          </div>
        ) : null}
      </section>

      {/* 3. Middle Grid: Financial Breakdown & Facility Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Breakdown (Backed by GET /api/analytics/revenue) */}
        <section
          aria-label="Revenue Metrics"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Revenue by Payment Method</h3>
                  <p className="text-xs text-gray-400">Month-to-Date Financial Stream</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              {revenueQuery.isLoading ? (
                <div className="space-y-4 py-8 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                </div>
              ) : revenueQuery.isError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
                  <span>Failed to load financial breakdown.</span>
                  <button onClick={() => revenueQuery.refetch()} className="font-bold underline">
                    Retry
                  </button>
                </div>
              ) : revenueQuery.data ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Gross Total</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 font-mono">
                        {formatCurrency(revenueQuery.data.grossRevenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block">Refunds</span>
                      <span className="text-xs sm:text-sm font-bold text-red-600 font-mono">
                        -{formatCurrency(revenueQuery.data.refundedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block">Net Collected</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
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
              ) : null}
            </div>
          </div>
        </section>

        {/* Facility Flow & Hourly Distribution (Backed by GET /api/analytics/attendance) */}
        <section
          aria-label="Attendance Analytics"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Facility Occupancy & Peak Flow</h3>
                  <p className="text-xs text-gray-400">Today's Hourly Check-In Timeline</p>
                </div>
              </div>

              {attendanceQuery.data && (
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                  {attendanceQuery.data.date}
                </span>
              )}
            </div>

            <div className="pt-4">
              {attendanceQuery.isLoading ? (
                <div className="space-y-4 py-8 animate-pulse">
                  <div className="h-32 bg-gray-100 rounded-lg w-full" />
                </div>
              ) : attendanceQuery.isError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
                  <span>Failed to load attendance analytics.</span>
                  <button onClick={() => attendanceQuery.refetch()} className="font-bold underline">
                    Retry
                  </button>
                </div>
              ) : attendanceQuery.data ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Unique Members</span>
                      <span className="text-sm font-bold text-gray-900">
                        {attendanceQuery.data.uniqueMembers} of {attendanceQuery.data.totalCheckIns} visits
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500 block">Flow Capacity Utilization</span>
                      {attendanceQuery.data.flowUtilizationPercent !== null ? (
                        <span className="text-sm font-bold text-gym-700">
                          {attendanceQuery.data.flowUtilizationPercent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-medium text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded mt-0.5">
                          Unavailable (Capacity Unset)
                        </span>
                      )}
                    </div>
                  </div>

                  <HourlyAttendanceChart
                    distribution={attendanceQuery.data.hourlyDistribution}
                    peakHourCount={attendanceQuery.data.peakHourCheckIns}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* 4. Bottom Section: Membership Retention & Expirations (Backed by GET /api/analytics/membership-retention) */}
      <section
        aria-label="Membership Pipeline"
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Membership Expiration Pipeline</h3>
            <p className="text-xs text-gray-400">30-Day Forward Expiration Window & Plan Popularity</p>
          </div>
        </div>

        {retentionQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 animate-pulse">
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
        ) : retentionQuery.isError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
            <span>Failed to load retention metrics.</span>
            <button onClick={() => retentionQuery.refetch()} className="font-bold underline">
              Retry
            </button>
          </div>
        ) : retentionQuery.data ? (
          <div className="space-y-6">
            {/* Expiration Buckets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                <span className="text-xs font-semibold text-red-800 block">Critical: Next 7 Days</span>
                <span className="text-2xl font-extrabold text-red-900 mt-1 block">
                  {retentionQuery.data.expiringBuckets.within7Days}
                </span>
                <span className="text-[11px] text-red-600">Immediate renewal outreach</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-xs font-semibold text-amber-800 block">Upcoming: 8 to 14 Days</span>
                <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
                  {retentionQuery.data.expiringBuckets.between8And14Days}
                </span>
                <span className="text-[11px] text-amber-600">Upcoming renewal window</span>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-xs font-semibold text-blue-800 block">Horizon: 15 to 30 Days</span>
                <span className="text-2xl font-extrabold text-blue-900 mt-1 block">
                  {retentionQuery.data.expiringBuckets.between15And30Days}
                </span>
                <span className="text-[11px] text-blue-600">Standard pipeline queue</span>
              </div>
            </div>

            {/* Plan Distribution List */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Active Plan Distribution
              </h4>
              {retentionQuery.data.planDistribution.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No active memberships found in tenant.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {retentionQuery.data.planDistribution.map((plan) => (
                    <div
                      key={plan.planId}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between"
                    >
                      <span className="text-xs font-medium text-gray-800 truncate mr-2">
                        {plan.planName}
                      </span>
                      <span className="text-xs font-bold text-gym-700 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0">
                        {plan.activeCount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
