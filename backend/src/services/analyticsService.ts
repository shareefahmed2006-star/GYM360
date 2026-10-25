import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  RevenueMetricsResponse,
  RevenueByMethod,
  DailyRevenueItem,
  AttendanceAnalyticsResponse,
  MembershipRetentionResponse,
  DashboardAnalyticsResponse
} from '../types/analytics';
import {
  getTodayUtcDateString,
  calculateEndDateUtc,
  isValidUtcDateString
} from '../utils/dateUtils';

export class AnalyticsService {
  /**
   * Helper: Validates optional branchId and ensures it belongs to the tenant.
   */
  static async validateTenantBranch(
    tenantId: ObjectId,
    branchIdStr?: string
  ): Promise<ObjectId | undefined> {
    if (!branchIdStr) return undefined;
    if (!ObjectId.isValid(branchIdStr)) {
      throw new AppError('Invalid branchId parameter format. Expected 24-character hex ObjectId.', 400);
    }
    const branchObjectId = new ObjectId(branchIdStr);
    const db = dbConnection.getDb();
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId
    });
    if (!branch) {
      throw new AppError('Referenced branch not found in your organization.', 404);
    }
    return branchObjectId;
  }

  /**
   * Reusable revenue metric calculation adhering strictly to M13 rules.
   * Handles completed vs refunded payments and excludes pending/failed.
   */
  static async calculateRevenueMetrics(
    tenantId: ObjectId,
    branchObjectId: ObjectId | undefined,
    startDate: string,
    endDate: string
  ): Promise<RevenueMetricsResponse> {
    const db = dbConnection.getDb();

    const matchQuery: any = {
      status: { $in: ['completed', 'refunded'] },
      paymentDate: { $gte: startDate, $lte: endDate }
    };
    if (tenantId) {
      matchQuery.organizationId = tenantId;
    }
    if (branchObjectId) {
      matchQuery.branchId = branchObjectId;
    }

    const payments = await db.collection('payments').find(matchQuery).toArray();

    let grossRevenue = 0;
    let refundedAmount = 0;
    let completedCount = 0;
    let refundedCount = 0;

    const methodMap: Record<string, RevenueByMethod> = {
      cash: { gross: 0, refunded: 0, net: 0, completedCount: 0, refundedCount: 0 },
      card: { gross: 0, refunded: 0, net: 0, completedCount: 0, refundedCount: 0 },
      upi: { gross: 0, refunded: 0, net: 0, completedCount: 0, refundedCount: 0 },
      bank_transfer: { gross: 0, refunded: 0, net: 0, completedCount: 0, refundedCount: 0 }
    };

    const dailyMap = new Map<string, DailyRevenueItem>();

    for (const p of payments) {
      const amt = typeof p.amount === 'number' ? p.amount : Number(p.amount) || 0;
      const method = p.paymentMethod || 'cash';
      const date = p.paymentDate;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          grossRevenue: 0,
          refundedAmount: 0,
          netRevenue: 0,
          completedCount: 0,
          refundedCount: 0
        });
      }
      const dayItem = dailyMap.get(date)!;

      if (p.status === 'completed') {
        grossRevenue += amt;
        completedCount++;
        if (methodMap[method]) {
          methodMap[method].gross += amt;
          methodMap[method].completedCount++;
        }
        dayItem.grossRevenue += amt;
        dayItem.completedCount++;
      } else if (p.status === 'refunded') {
        refundedAmount += amt;
        refundedCount++;
        if (methodMap[method]) {
          methodMap[method].refunded += amt;
          methodMap[method].refundedCount++;
        }
        dayItem.refundedAmount += amt;
        dayItem.refundedCount++;
      }
    }

    // Compute net for methods
    for (const key of Object.keys(methodMap)) {
      methodMap[key].net = methodMap[key].gross - methodMap[key].refunded;
    }

    // Compute net for daily series and sort chronologically
    const timeSeries: DailyRevenueItem[] = Array.from(dailyMap.values())
      .map((d) => ({
        ...d,
        netRevenue: d.grossRevenue - d.refundedAmount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const netRevenue = grossRevenue - refundedAmount;

    return {
      startDate,
      endDate,
      grossRevenue,
      refundedAmount,
      netRevenue,
      completedCount,
      refundedCount,
      byPaymentMethod: {
        cash: methodMap.cash,
        card: methodMap.card,
        upi: methodMap.upi,
        bank_transfer: methodMap.bank_transfer
      },
      timeSeries
    };
  }

  /**
   * Reusable attendance metric calculation adhering strictly to M13 rules.
   * Distinguishes check-in events, unique members, and currentlyCheckedIn (all recorded open sessions).
   */
  static async calculateAttendanceMetrics(
    tenantId: ObjectId,
    branchObjectId: ObjectId | undefined,
    dateStr: string
  ): Promise<AttendanceAnalyticsResponse> {
    const db = dbConnection.getDb();

    // 1. Total check-ins and unique members on requested UTC date
    // In attendance documents, checkInTime is an ISO string like "2026-10-07T04:35:58.106Z"
    const dateRegex = new RegExp(`^${dateStr}`);
    const matchQueryDate: any = {
      organizationId: tenantId,
      status: 'present',
      checkInTime: { $regex: dateRegex }
    };
    if (branchObjectId) {
      matchQueryDate.branchId = branchObjectId;
    }

    const dayAttendance = await db.collection('attendance').find(matchQueryDate).toArray();

    const totalCheckIns = dayAttendance.length;
    const uniqueMemberSet = new Set<string>();
    const hourlyDistribution = new Array<number>(24).fill(0);

    for (const att of dayAttendance) {
      if (att.memberId) {
        uniqueMemberSet.add(att.memberId.toString());
      }
      if (typeof att.checkInTime === 'string') {
        const timePart = att.checkInTime.split('T')[1];
        if (timePart) {
          const hour = parseInt(timePart.slice(0, 2), 10);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourlyDistribution[hour]++;
          }
        }
      }
    }

    const uniqueMembers = uniqueMemberSet.size;
    const peakHourCheckIns = Math.max(0, ...hourlyDistribution);

    // 2. Currently Checked-In (all recorded open sessions: checkOutTime === "", regardless of when initiated)
    const openSessionsQuery: any = {
      organizationId: tenantId,
      status: 'present',
      checkOutTime: ''
    };
    if (branchObjectId) {
      openSessionsQuery.branchId = branchObjectId;
    }

    const currentlyCheckedIn = await db.collection('attendance').countDocuments(openSessionsQuery);

    // 3. Flow utilization percent (only when branchId is specified and branch.capacity > 0)
    let flowUtilizationPercent: number | null = null;
    if (branchObjectId) {
      const branch = await db.collection('branches').findOne({
        _id: branchObjectId,
        organizationId: tenantId
      });
      const capacity = typeof branch?.capacity === 'number' ? branch.capacity : 0;
      if (capacity > 0) {
        flowUtilizationPercent = Math.round((peakHourCheckIns / capacity) * 1000) / 10;
      }
    }

    return {
      date: dateStr,
      totalCheckIns,
      uniqueMembers,
      currentlyCheckedIn,
      hourlyDistribution,
      peakHourCheckIns,
      flowUtilizationPercent
    };
  }

  /**
   * Reusable membership retention & expiration calculation adhering strictly to M13 rules.
   * Enforces endDate > todayUtc for currently valid memberships.
   * Reports mutually exclusive and cumulative buckets, and counts stale active memberships.
   */
  static async calculateRetentionMetrics(
    tenantId: ObjectId,
    branchObjectId: ObjectId | undefined,
    daysAhead: number
  ): Promise<MembershipRetentionResponse> {
    const db = dbConnection.getDb();
    const todayUtc = getTodayUtcDateString();

    const d7 = calculateEndDateUtc(todayUtc, 7);
    const d14 = calculateEndDateUtc(todayUtc, 14);
    const d30 = calculateEndDateUtc(todayUtc, 30);
    const dHorizon = calculateEndDateUtc(todayUtc, daysAhead);

    const baseQuery: any = tenantId ? { organizationId: tenantId } : {};
    if (branchObjectId) {
      baseQuery.branchId = branchObjectId;
    }

    const allMemberships = await db.collection('memberships').find(baseQuery).toArray();

    let currentlyActiveCount = 0;
    let staleActiveCount = 0;
    let historicalExpiredCount = 0;
    let historicalCancelledCount = 0;

    let within7Days = 0;
    let between8And14Days = 0;
    let between15And30Days = 0;
    let totalExpiringInWindow = 0;

    const planActiveCounts = new Map<string, number>();

    for (const m of allMemberships) {
      if (m.status === 'expired') {
        historicalExpiredCount++;
        continue;
      }
      if (m.status === 'cancelled') {
        historicalCancelledCount++;
        continue;
      }

      if (m.status === 'active') {
        // Strict GYM360 validity rule: startDate <= todayUtc AND endDate > todayUtc
        if (m.startDate <= todayUtc && m.endDate > todayUtc) {
          currentlyActiveCount++;

          // Track plan distribution for currently active memberships
          if (m.planId) {
            const planKey = m.planId.toString();
            planActiveCounts.set(planKey, (planActiveCounts.get(planKey) || 0) + 1);
          }

          // Evaluate non-overlapping upcoming expiration buckets
          if (m.endDate > todayUtc && m.endDate <= d7) {
            within7Days++;
          } else if (m.endDate > d7 && m.endDate <= d14) {
            between8And14Days++;
          } else if (m.endDate > d14 && m.endDate <= d30) {
            between15And30Days++;
          }

          // Custom window horizon
          if (m.endDate > todayUtc && m.endDate <= dHorizon) {
            totalExpiringInWindow++;
          }
        } else if (m.endDate <= todayUtc) {
          // Stale active: active status flag but endDate has passed or equals today
          staleActiveCount++;
        }
      }
    }

    // Cumulative rollups
    const expiringIn7Days = within7Days;
    const expiringIn14Days = within7Days + between8And14Days;
    const expiringIn30Days = within7Days + between8And14Days + between15And30Days;

    // Resolve plan names using double-walled tenant defense
    const planIds = Array.from(planActiveCounts.keys()).map((id) => new ObjectId(id));
    const plans = await db
      .collection('membershipPlans')
      .find({
        _id: { $in: planIds },
        organizationId: tenantId
      })
      .toArray();

    const planNameMap = new Map<string, string>(
      plans.map((p) => [p._id.toString(), p.name || 'Unnamed Plan'])
    );

    const planDistribution = Array.from(planActiveCounts.entries()).map(([planId, activeCount]) => ({
      planId,
      planName: planNameMap.get(planId) || 'Unknown Plan',
      activeCount
    }));

    return {
      horizonDays: daysAhead,
      currentlyActiveCount,
      expiringBuckets: {
        within7Days,
        between8And14Days,
        between15And30Days
      },
      cumulativeExpiring: {
        expiringIn7Days,
        expiringIn14Days,
        expiringIn30Days
      },
      totalExpiringInWindow,
      staleActiveCount,
      historicalExpiredCount,
      historicalCancelledCount,
      planDistribution
    };
  }

  /**
   * Primary executive overview KPI dashboard adhering to shared rules.
   */
  static async getExecutiveDashboard(
    tenantId: ObjectId,
    branchObjectId?: ObjectId
  ): Promise<DashboardAnalyticsResponse> {
    const db = dbConnection.getDb();
    const todayUtc = getTodayUtcDateString();
    const monthStart = `${todayUtc.slice(0, 7)}-01`;

    // 1. Members and Retention KPIs
    const retention = await this.calculateRetentionMetrics(tenantId, branchObjectId, 30);
    const memberBaseQuery: any = tenantId ? { organizationId: tenantId } : {};
    if (branchObjectId) {
      memberBaseQuery.branchId = branchObjectId;
    }
    const totalRegistered = await db.collection('members').countDocuments(memberBaseQuery);

    // 2. Revenue MTD
    const revenueRes = await this.calculateRevenueMetrics(tenantId, branchObjectId, monthStart, todayUtc);

    // 3. Attendance Today & Current Open Sessions
    const attendanceRes = await this.calculateAttendanceMetrics(tenantId, branchObjectId, todayUtc);

    // 4. Equipment Health
    const equipQuery: any = tenantId ? { organizationId: tenantId } : {};
    if (branchObjectId) {
      equipQuery.branchId = branchObjectId;
    }
    const equipmentDocs = await db.collection('equipment').find(equipQuery).toArray();
    const equipTotal = equipmentDocs.length;
    let equipOperational = 0;
    let equipUnderMaintenance = 0;
    let equipOutOfService = 0;

    for (const eq of equipmentDocs) {
      if (eq.status === 'operational') equipOperational++;
      else if (eq.status === 'under_maintenance') equipUnderMaintenance++;
      else if (eq.status === 'out_of_service') equipOutOfService++;
    }

    const operationalPercentage =
      equipTotal > 0 ? Math.round((equipOperational / equipTotal) * 1000) / 10 : 0;

    // 5. Trainer Sessions MTD
    const sessionQuery: any = {
      sessionDate: { $gte: monthStart, $lte: todayUtc }
    };
    if (tenantId) {
      sessionQuery.organizationId = tenantId;
    }
    if (branchObjectId) {
      sessionQuery.branchId = branchObjectId;
    }
    const sessions = await db.collection('trainerSessions').find(sessionQuery).toArray();
    let mtdCompleted = 0;
    let mtdScheduled = 0;
    let mtdCancelled = 0;

    for (const s of sessions) {
      if (s.status === 'completed') mtdCompleted++;
      else if (s.status === 'scheduled') mtdScheduled++;
      else if (s.status === 'cancelled') mtdCancelled++;
    }

    return {
      members: {
        totalRegistered,
        currentlyActive: retention.currentlyActiveCount,
        expiringIn30Days: retention.cumulativeExpiring.expiringIn30Days,
        staleActiveCount: retention.staleActiveCount,
        historicalExpiredCount: retention.historicalExpiredCount,
        historicalCancelledCount: retention.historicalCancelledCount
      },
      revenue: {
        mtd: {
          startDate: monthStart,
          endDate: todayUtc,
          grossRevenue: revenueRes.grossRevenue,
          refundedAmount: revenueRes.refundedAmount,
          netRevenue: revenueRes.netRevenue,
          completedCount: revenueRes.completedCount,
          refundedCount: revenueRes.refundedCount
        }
      },
      attendance: {
        todayCheckIns: attendanceRes.totalCheckIns,
        currentlyCheckedIn: attendanceRes.currentlyCheckedIn
      },
      equipment: {
        total: equipTotal,
        operational: equipOperational,
        underMaintenance: equipUnderMaintenance,
        outOfService: equipOutOfService,
        operationalPercentage
      },
      trainerSessions: {
        mtdCompleted,
        mtdScheduled,
        mtdCancelled
      }
    };
  }
}
