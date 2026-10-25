import React from 'react';
import { DashboardAnalyticsResponse } from '../../types/analytics.types';
import { KpiCard } from './KpiCard';
import {
  DollarSign,
  Users,
  CalendarCheck,
  Dumbbell,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface ExecutiveKpiGridProps {
  data: DashboardAnalyticsResponse;
  formatCurrency: (val: number) => string;
}

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({
  data,
  formatCurrency,
}) => {
  const { members, revenue, attendance, equipment, trainerSessions } = data;

  const mtdNet = revenue.mtd.netRevenue;
  const mtdGross = revenue.mtd.grossRevenue;
  const mtdRefund = revenue.mtd.refundedAmount;

  return (
    <div className="space-y-4">
      {/* Stale active memberships warning callout if present */}
      {members.staleActiveCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Data Notice:</strong> {members.staleActiveCount} membership{members.staleActiveCount > 1 ? 's are' : ' is'} marked active in the database but have passed their expiration end date.
            </span>
          </div>
          <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] shrink-0 ml-2">
            Action Recommended
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Revenue MTD */}
        <KpiCard
          title="Net Revenue (MTD)"
          value={formatCurrency(mtdNet)}
          subtitle={`Gross: ${formatCurrency(mtdGross)}${mtdRefund > 0 ? ` · Ref: -${formatCurrency(mtdRefund)}` : ''}`}
          icon={DollarSign}
          color="green"
          badge={{
            text: `${revenue.mtd.completedCount} Paid${revenue.mtd.refundedCount > 0 ? ` (${revenue.mtd.refundedCount} Ref)` : ''}`,
            variant: mtdNet >= 0 ? 'success' : 'warning',
          }}
        />

        {/* 2. Active Members */}
        <KpiCard
          title="Active Members"
          value={members.currentlyActive}
          subtitle={`${members.totalRegistered} total registered`}
          icon={Users}
          color="blue"
          badge={{
            text: `${members.expiringIn30Days} Expiring (30d)`,
            variant: members.expiringIn30Days > 0 ? 'warning' : 'neutral',
          }}
        />

        {/* 3. Facility Attendance */}
        <KpiCard
          title="Today's Check-Ins"
          value={attendance.todayCheckIns}
          subtitle={`${attendance.currentlyCheckedIn} currently inside facility`}
          icon={CalendarCheck}
          color="purple"
          badge={{
            text: `${attendance.currentlyCheckedIn} Live Flow`,
            variant: 'info',
          }}
        />

        {/* 4. Equipment Reliability */}
        <KpiCard
          title="Equipment Health"
          value={`${equipment.operationalPercentage.toFixed(1)}%`}
          subtitle={`${equipment.operational} of ${equipment.total} operational`}
          icon={Dumbbell}
          color="amber"
          badge={{
            text: equipment.underMaintenance + equipment.outOfService > 0
              ? `${equipment.underMaintenance + equipment.outOfService} Need Service`
              : 'All Systems Go',
            variant: equipment.underMaintenance + equipment.outOfService > 0 ? 'warning' : 'success',
          }}
        />

        {/* 5. Trainer Session Volume */}
        <KpiCard
          title="Trainer Sessions (MTD)"
          value={trainerSessions.mtdCompleted}
          subtitle={`${trainerSessions.mtdScheduled} scheduled upcoming`}
          icon={UserCheck}
          color="blue"
          badge={{
            text: `${trainerSessions.mtdCancelled} Cancelled`,
            variant: trainerSessions.mtdCancelled > 0 ? 'neutral' : 'success',
          }}
        />
      </div>
    </div>
  );
};
