export interface RevenueByMethod {
  gross: number;
  refunded: number;
  net: number;
  completedCount: number;
  refundedCount: number;
}

export interface DailyRevenueItem {
  date: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  completedCount: number;
  refundedCount: number;
}

export interface RevenueMetricsResponse {
  startDate: string;
  endDate: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  completedCount: number;
  refundedCount: number;
  byPaymentMethod: {
    cash: RevenueByMethod;
    card: RevenueByMethod;
    upi: RevenueByMethod;
    bank_transfer: RevenueByMethod;
  };
  timeSeries: DailyRevenueItem[];
}

export interface AttendanceAnalyticsResponse {
  date: string;
  totalCheckIns: number;
  uniqueMembers: number;
  currentlyCheckedIn: number;
  hourlyDistribution: number[]; // exactly 24 slots (0..23)
  peakHourCheckIns: number;
  flowUtilizationPercent: number | null;
}

export interface MembershipRetentionResponse {
  horizonDays: number;
  currentlyActiveCount: number;
  expiringBuckets: {
    within7Days: number;
    between8And14Days: number;
    between15And30Days: number;
  };
  cumulativeExpiring: {
    expiringIn7Days: number;
    expiringIn14Days: number;
    expiringIn30Days: number;
  };
  totalExpiringInWindow: number;
  staleActiveCount: number;
  historicalExpiredCount: number;
  historicalCancelledCount: number;
  planDistribution: Array<{
    planId: string;
    planName: string;
    activeCount: number;
  }>;
}

export interface DashboardAnalyticsResponse {
  members: {
    totalRegistered: number;
    currentlyActive: number;
    expiringIn30Days: number;
    staleActiveCount: number;
    historicalExpiredCount: number;
    historicalCancelledCount: number;
  };
  revenue: {
    mtd: {
      startDate: string;
      endDate: string;
      grossRevenue: number;
      refundedAmount: number;
      netRevenue: number;
      completedCount: number;
      refundedCount: number;
    };
  };
  attendance: {
    todayCheckIns: number;
    currentlyCheckedIn: number;
  };
  equipment: {
    total: number;
    operational: number;
    underMaintenance: number;
    outOfService: number;
    operationalPercentage: number;
  };
  trainerSessions: {
    mtdCompleted: number;
    mtdScheduled: number;
    mtdCancelled: number;
  };
}
