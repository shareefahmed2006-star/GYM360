/**
 * TIER A: READ-ONLY INTEGRATION TEST SUITE AGAINST REAL GYM360 DATABASE
 * 
 * Strict Safety Rules:
 * 1. Target Server: http://localhost:5000 (running against GYM360).
 * 2. ONLY HTTP GET requests are allowed.
 *    EXCEPTION: POST /api/auth/login is permitted SOLELY to obtain JWT session tokens for existing seeded users.
 * 3. ZERO POST/PUT/PATCH/DELETE mutation requests against GYM360.
 * 4. Confirms tenant isolation, role authorization, branch boundaries, pagination, and projection safety.
 */

import http from 'http';
import { createApp } from '../../src/app';
import { dbConnection } from '../../src/config/database';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

interface TestResult {
  name: string;
  passed: boolean;
  statusCode: number;
  expectedStatus: number;
  details?: string;
}

const results: TestResult[] = [];

async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; data: any; headers: Headers }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data, headers: response.headers };
}

function recordTest(name: string, status: number, expectedStatus: number, condition: boolean, details?: string) {
  const passed = status === expectedStatus && condition;
  results.push({ name, passed, statusCode: status, expectedStatus, details });
  console.log(`[Tier A] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} (Status: ${status}, Expected: ${expectedStatus})`);
  if (!passed && details) {
    console.error(`       Error details: ${details}`);
  }
}

export async function runTierATests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
  console.log('=== STARTING TIER A: READ-ONLY INTEGRATION TESTS (REAL GYM360) ===');

  let server: http.Server | null = null;
  let ownServer = false;

  try {
    const probe = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!probe || !probe.ok) {
      console.log('[Tier A Setup] Starting in-process test server on port 5000 against GYM360...');
      await dbConnection.connect();
      const app = createApp();
      server = http.createServer(app);
      await new Promise<void>((resolve) => server!.listen(5000, () => resolve()));
      ownServer = true;
      console.log('[Tier A Setup] Test server listening on port 5000.');
    }
  } catch (err) {
    console.warn('[Tier A Setup] Note while checking server:', err);
  }

  try {
    // 1. Health check
  const healthRes = await apiRequest('/api/health');
  recordTest(
    '1. Health Check Endpoint',
    healthRes.status,
    200,
    healthRes.data?.status === 'ok' && healthRes.data?.database?.status === 'connected',
    JSON.stringify(healthRes.data)
  );

  // 2. Auth: Valid Admin Login (Org 1)
  const adminLogin = await apiRequest('/api/auth/login', 'POST', {
    email: 'seed.admin.kothrud@gym360.com',
    password: 'Gym360@Seed2026',
  });
  const adminToken = adminLogin.data?.data?.token;
  recordTest(
    '2. Admin Login (Valid Credentials)',
    adminLogin.status,
    200,
    !!adminToken && adminLogin.data?.data?.user?.role === 'admin'
  );

  // 3. Auth: Valid Member Login (Org 1)
  const memberLogin = await apiRequest('/api/auth/login', 'POST', {
    email: 'seed.user.seed.member.1@gym360.com',
    password: 'Gym360@Seed2026',
  });
  const memberToken = memberLogin.data?.data?.token;
  recordTest(
    '3. Member Login (Valid Credentials)',
    memberLogin.status,
    200,
    !!memberToken && memberLogin.data?.data?.user?.role === 'member'
  );

  // 4. Auth: Valid Admin Login (Org 2)
  const org2AdminLogin = await apiRequest('/api/auth/login', 'POST', {
    email: 'seed.admin.ironpulse@gym360.com',
    password: 'Gym360@Seed2026',
  });
  const org2AdminToken = org2AdminLogin.data?.data?.token;
  recordTest(
    '4. Org 2 Admin Login (Valid Credentials)',
    org2AdminLogin.status,
    200,
    !!org2AdminToken && org2AdminLogin.data?.data?.user?.role === 'admin'
  );

  // 5. Auth: Invalid Login Attempt
  const invalidLogin = await apiRequest('/api/auth/login', 'POST', {
    email: 'seed.admin.kothrud@gym360.com',
    password: 'WrongPassword123!',
  });
  recordTest(
    '5. Invalid Password Rejection',
    invalidLogin.status,
    401,
    invalidLogin.data?.success === false
  );

  // 6. Auth: Profile Inspection (/api/auth/me) & passwordHash exclusion
  const meRes = await apiRequest('/api/auth/me', 'GET', undefined, adminToken);
  const meUser = meRes.data?.data?.user || meRes.data?.data;
  recordTest(
    '6. /api/auth/me Safe Projection (No passwordHash)',
    meRes.status,
    200,
    meUser?.passwordHash === undefined && meUser?.email === 'seed.admin.kothrud@gym360.com'
  );

  // 7. Organization: GET /api/organization
  const orgRes = await apiRequest('/api/organization', 'GET', undefined, adminToken);
  const orgData = orgRes.data?.data?.organization || orgRes.data?.data;
  recordTest(
    '7. Read Organization Profile',
    orgRes.status,
    200,
    orgData?.name === 'GYM360 Demo Gym'
  );

  // 8. Tenant Isolation: Client supplies conflicting ?organizationId=
  const crossTenantParamRes = await apiRequest(
    '/api/organization?organizationId=6ac2640ffcbf8d411bca8bd9',
    'GET',
    undefined,
    adminToken
  );
  recordTest(
    '8. Cross-Tenant Rejection on Mismatched Query Param',
    crossTenantParamRes.status,
    403,
    crossTenantParamRes.data?.success === false
  );

  // 9. Branches: List Branches
  const branchesRes = await apiRequest('/api/branches', 'GET', undefined, adminToken);
  const branchesList = branchesRes.data?.data?.branches || branchesRes.data?.data;
  recordTest(
    '9. List Branches',
    branchesRes.status,
    200,
    Array.isArray(branchesList) && branchesList.length > 0
  );

  // 10. Branch Access: Member Reads Assigned Branch
  const memberAssignedBranchId = memberLogin.data?.data?.user?.branchId || '6ac2668bfcbf8d411bca8be5';
  const memberBranchRes = await apiRequest(`/api/branches/${memberAssignedBranchId}`, 'GET', undefined, memberToken);
  recordTest(
    '10. Member Reads Assigned Branch',
    memberBranchRes.status,
    200,
    memberBranchRes.data?.success === true
  );

  // 11. Branch Access: Member Reads Unassigned Branch in Same Org
  const unassignedBranchId = '6ac5c276197c2335de45e1d4'; // Kothrud branch
  const unassignedBranchRes = await apiRequest(`/api/branches/${unassignedBranchId}`, 'GET', undefined, memberToken);
  recordTest(
    '11. Member Denied Access to Unassigned Branch (403)',
    unassignedBranchRes.status,
    403,
    unassignedBranchRes.data?.success === false
  );

  // 12. Members: List Members with status filter
  const membersRes = await apiRequest('/api/members?status=active&limit=10', 'GET', undefined, adminToken);
  const membersList = membersRes.data?.data?.members || membersRes.data?.data;
  recordTest(
    '12. List Active Members (Paginated)',
    membersRes.status,
    200,
    Array.isArray(membersList) && membersList.length > 0
  );

  // 13. Membership Plans: List Plans
  const plansRes = await apiRequest('/api/membership-plans?status=active', 'GET', undefined, adminToken);
  const plansList = plansRes.data?.data?.plans || plansRes.data?.data;
  recordTest(
    '13. List Membership Plans',
    plansRes.status,
    200,
    Array.isArray(plansList) && plansList.length > 0
  );

  // 14. Memberships: List Memberships
  const membershipsRes = await apiRequest('/api/memberships?status=active&limit=5', 'GET', undefined, adminToken);
  const membershipsList = membershipsRes.data?.data?.memberships || membershipsRes.data?.data;
  recordTest(
    '14. List Memberships (Active filter)',
    membershipsRes.status,
    200,
    Array.isArray(membershipsList)
  );

  // 15. Payments: List Payments
  const paymentsRes = await apiRequest('/api/payments?limit=5', 'GET', undefined, adminToken);
  const paymentsList = paymentsRes.data?.data?.payments || paymentsRes.data?.data;
  recordTest(
    '15. List Payments with Pagination',
    paymentsRes.status,
    200,
    Array.isArray(paymentsList)
  );

  // 16. Attendance: List Attendance
  const attendanceRes = await apiRequest('/api/attendance?limit=5', 'GET', undefined, adminToken);
  recordTest(
    '16. List Attendance Records',
    attendanceRes.status,
    200,
    Array.isArray(attendanceRes.data?.data)
  );

  // 17. Trainers: List Trainers
  const trainersRes = await apiRequest('/api/trainers?limit=5', 'GET', undefined, adminToken);
  recordTest(
    '17. List Trainers',
    trainersRes.status,
    200,
    Array.isArray(trainersRes.data?.data) && trainersRes.data?.data.length > 0
  );

  // 18. Trainer Availability: Read Slots
  const sampleTrainerId = trainersRes.data?.data?.[0]?._id;
  const availRes = await apiRequest(`/api/trainers/${sampleTrainerId}/availability`, 'GET', undefined, adminToken);
  recordTest(
    '18. Read Trainer Availability Slots',
    availRes.status,
    200,
    Array.isArray(availRes.data?.data)
  );

  // 19. Trainer Sessions: List Sessions
  const sessionsRes = await apiRequest('/api/trainer-sessions?limit=5', 'GET', undefined, adminToken);
  recordTest(
    '19. List Trainer Sessions',
    sessionsRes.status,
    200,
    Array.isArray(sessionsRes.data?.data)
  );

  // 20. Workout Plans: List Workout Plans
  const workoutPlansRes = await apiRequest('/api/workout-plans?limit=5', 'GET', undefined, adminToken);
  recordTest(
    '20. List Workout Plans',
    workoutPlansRes.status,
    200,
    Array.isArray(workoutPlansRes.data?.data)
  );

  // 21. Member Workout Plans: List Assignments
  const memberWorkoutPlansRes = await apiRequest('/api/member-workout-plans?limit=5', 'GET', undefined, adminToken);
  recordTest(
    '21. List Member Workout Plan Assignments',
    memberWorkoutPlansRes.status,
    200,
    Array.isArray(memberWorkoutPlansRes.data?.data)
  );

  // 22. Cross-Tenant Read Isolation: Org 1 Admin attempts to read Org 2 Trainer
  const org2TrainersRes = await apiRequest('/api/trainers?limit=5', 'GET', undefined, org2AdminToken);
  const org2TrainerId = org2TrainersRes.data?.data?.[0]?._id;
  if (org2TrainerId) {
    const crossTrainerRes = await apiRequest(`/api/trainers/${org2TrainerId}`, 'GET', undefined, adminToken);
    recordTest(
      '22. Cross-Tenant Trainer Read Isolation (404 Not Found)',
      crossTrainerRes.status,
      404,
      crossTrainerRes.data?.success === false
    );
  }

  // 23. Temporary M3 Routes: Admin-Only Route
  const m3AdminRes = await apiRequest('/api/test-access/admin-only', 'GET', undefined, adminToken);
  recordTest(
    '23. M3 Temporary Route: /api/test-access/admin-only',
    m3AdminRes.status,
    200,
    m3AdminRes.data?.success === true
  );

  // 24. Temporary M3 Routes: Member Denied on Admin-Only Route
  const m3MemberDeniedRes = await apiRequest('/api/test-access/admin-only', 'GET', undefined, memberToken);
  recordTest(
    '24. M3 Temporary Route: Member Denied (403)',
    m3MemberDeniedRes.status,
    403,
    m3MemberDeniedRes.data?.success === false
  );

  // 25. M11 Equipment: List Equipment with Pagination (Admin)
  const equipmentRes = await apiRequest('/api/equipment?page=1&limit=5', 'GET', undefined, adminToken);
  recordTest(
    '25. M11 Equipment: List Equipment (Admin, Paginated)',
    equipmentRes.status,
    200,
    Array.isArray(equipmentRes.data?.data) && equipmentRes.data?.data.length > 0 && equipmentRes.data?.total > 0
  );

  // 26. M11 Equipment: Get Equipment Details (Admin)
  const sampleEquipmentId = equipmentRes.data?.data?.[0]?._id;
  const singleEquipmentRes = await apiRequest(`/api/equipment/${sampleEquipmentId}`, 'GET', undefined, adminToken);
  recordTest(
    '26. M11 Equipment: Read Single Equipment (Admin)',
    singleEquipmentRes.status,
    200,
    singleEquipmentRes.data?.success === true && singleEquipmentRes.data?.data?._id === sampleEquipmentId
  );

  // 27. M11 Equipment: Member Denied Access (403)
  const memberEquipmentRes = await apiRequest('/api/equipment', 'GET', undefined, memberToken);
  recordTest(
    '27. M11 Equipment: Member Access Denied (403)',
    memberEquipmentRes.status,
    403,
    memberEquipmentRes.data?.success === false
  );

  // 28. M11 Maintenance: List Maintenance Logs with Pagination (Admin)
  const maintenanceRes = await apiRequest('/api/maintenance-logs?page=1&limit=5', 'GET', undefined, adminToken);
  recordTest(
    '28. M11 Maintenance: List Maintenance Logs (Admin, Paginated)',
    maintenanceRes.status,
    200,
    Array.isArray(maintenanceRes.data?.data) && maintenanceRes.data?.data.length > 0 && maintenanceRes.data?.total > 0
  );

  // 29. M11 Maintenance: Get Maintenance Log Details (Admin)
  const sampleMaintenanceId = maintenanceRes.data?.data?.[0]?._id;
  const singleMaintenanceRes = await apiRequest(`/api/maintenance-logs/${sampleMaintenanceId}`, 'GET', undefined, adminToken);
  recordTest(
    '29. M11 Maintenance: Read Single Log (Admin)',
    singleMaintenanceRes.status,
    200,
    singleMaintenanceRes.data?.success === true && singleMaintenanceRes.data?.data?._id === sampleMaintenanceId
  );

  // 30. M11 Maintenance: Member Denied Access (403)
  const memberMaintenanceRes = await apiRequest('/api/maintenance-logs', 'GET', undefined, memberToken);
  recordTest(
    '30. M11 Maintenance: Member Access Denied (403)',
    memberMaintenanceRes.status,
    403,
    memberMaintenanceRes.data?.success === false
  );

  // 31. M11 Audit Logs: List Audit Logs with Pagination (Admin)
  const auditRes = await apiRequest('/api/audit-logs?page=1&limit=5', 'GET', undefined, adminToken);
  recordTest(
    '31. M11 Audit Logs: List Audit Logs (Admin, Paginated)',
    auditRes.status,
    200,
    Array.isArray(auditRes.data?.data) && auditRes.data?.data.length > 0 && auditRes.data?.total > 0
  );

  // 32. M11 Audit Logs: Member Denied Access (403)
  const memberAuditRes = await apiRequest('/api/audit-logs', 'GET', undefined, memberToken);
  recordTest(
    '32. M11 Audit Logs: Member Access Denied (403)',
    memberAuditRes.status,
    403,
    memberAuditRes.data?.success === false
  );

  // 33. M12 Notifications: List Notifications (Admin, Paginated)
  const notifAdminRes = await apiRequest('/api/notifications?page=1&limit=5', 'GET', undefined, adminToken);
  recordTest(
    '33. M12 Notifications: List Notifications (Admin, Paginated)',
    notifAdminRes.status,
    200,
    Array.isArray(notifAdminRes.data?.data) && notifAdminRes.data?.data.length > 0 && notifAdminRes.data?.total > 0
  );

  // 34. M12 Notifications: List Notifications (Member Scoped)
  const notifMemberRes = await apiRequest('/api/notifications?page=1&limit=5', 'GET', undefined, memberToken);
  recordTest(
    '34. M12 Notifications: List Notifications (Member Scoped)',
    notifMemberRes.status,
    200,
    Array.isArray(notifMemberRes.data?.data) &&
      notifMemberRes.data?.data.every((n: any) => n.recipientUserId === memberLogin.data?.data?.user?.userId)
  );

  // 35. M12 Notifications: Read Single Notification (Admin)
  const sampleNotifId = notifAdminRes.data?.data?.[0]?._id;
  const singleNotifAdminRes = await apiRequest(`/api/notifications/${sampleNotifId}`, 'GET', undefined, adminToken);
  recordTest(
    '35. M12 Notifications: Read Single Notification (Admin)',
    singleNotifAdminRes.status,
    200,
    singleNotifAdminRes.data?.success === true && singleNotifAdminRes.data?.data?._id === sampleNotifId
  );

  // 36. M12 Notifications: Member Denied Unowned Notification (404 IDOR Protection)
  const memberDeniedRes = await apiRequest(`/api/notifications/${sampleNotifId}`, 'GET', undefined, memberToken);
  recordTest(
    '36. M12 Notifications: Member Denied Unowned Notification (404 IDOR)',
    memberDeniedRes.status,
    404,
    memberDeniedRes.data?.success === false
  );

  // 37. M12 Notifications: Cross-Tenant Access Denied for Admin (404 IDOR Protection)
  const crossOrgAdminDeniedRes = await apiRequest(`/api/notifications/${sampleNotifId}`, 'GET', undefined, org2AdminToken);
  recordTest(
    '37. M12 Notifications: Cross-Tenant Access Denied for Admin (404 IDOR)',
    crossOrgAdminDeniedRes.status,
    404,
    crossOrgAdminDeniedRes.data?.success === false
  );

  // 38. M12 Notifications: Invalid Notification ID Format (400)
  const invalidIdRes = await apiRequest('/api/notifications/invalid-id-format', 'GET', undefined, adminToken);
  recordTest(
    '38. M12 Notifications: Invalid ID Format (400)',
    invalidIdRes.status,
    400,
    invalidIdRes.data?.success === false
  );

  // 39. M12 Notifications: Unauthenticated Access Denied (401)
  const unauthNotifRes = await apiRequest('/api/notifications', 'GET');
  recordTest(
    '39. M12 Notifications: Unauthenticated Access Denied (401)',
    unauthNotifRes.status,
    401,
    unauthNotifRes.data?.success === false
  );

  // ==========================================
  // M13 EXECUTIVE ANALYTICS & DASHBOARD TESTS
  // ==========================================

  // 40. M13 Dashboard: Executive Overview (Admin)
  const dashboardRes = await apiRequest('/api/analytics/dashboard', 'GET', undefined, adminToken);
  recordTest(
    '40. M13 Dashboard: Executive Overview (Admin, 200 OK)',
    dashboardRes.status,
    200,
    dashboardRes.data?.success === true &&
      typeof dashboardRes.data?.data?.members?.totalRegistered === 'number' &&
      typeof dashboardRes.data?.data?.revenue?.mtd?.grossRevenue === 'number' &&
      typeof dashboardRes.data?.data?.attendance?.todayCheckIns === 'number' &&
      typeof dashboardRes.data?.data?.equipment?.operationalPercentage === 'number'
  );

  // 41. M13 Revenue: Default Omitted Dates (MTD Interval)
  const revenueMtdRes = await apiRequest('/api/analytics/revenue', 'GET', undefined, adminToken);
  recordTest(
    '41. M13 Revenue: Default Omitted Dates (MTD Interval, 200 OK)',
    revenueMtdRes.status,
    200,
    revenueMtdRes.data?.success === true &&
      typeof revenueMtdRes.data?.data?.grossRevenue === 'number' &&
      typeof revenueMtdRes.data?.data?.netRevenue === 'number' &&
      Array.isArray(revenueMtdRes.data?.data?.timeSeries)
  );

  // 42. M13 Revenue: Explicit Date Range (200 OK)
  const revenueExplicitRes = await apiRequest(
    '/api/analytics/revenue?startDate=2026-10-01&endDate=2026-10-12',
    'GET',
    undefined,
    adminToken
  );
  recordTest(
    '42. M13 Revenue: Explicit Date Range (200 OK)',
    revenueExplicitRes.status,
    200,
    revenueExplicitRes.data?.success === true &&
      revenueExplicitRes.data?.data?.startDate === '2026-10-01' &&
      revenueExplicitRes.data?.data?.endDate === '2026-10-12' &&
      typeof revenueExplicitRes.data?.data?.byPaymentMethod?.cash?.net === 'number'
  );

  // 43. M13 Attendance: Today Distribution & Histogram (200 OK)
  const analyticsAttendanceRes = await apiRequest('/api/analytics/attendance', 'GET', undefined, adminToken);
  recordTest(
    '43. M13 Attendance: Today Distribution (24-slot Histogram, 200 OK)',
    analyticsAttendanceRes.status,
    200,
    analyticsAttendanceRes.data?.success === true &&
      Array.isArray(analyticsAttendanceRes.data?.data?.hourlyDistribution) &&
      analyticsAttendanceRes.data?.data?.hourlyDistribution.length === 24 &&
      typeof analyticsAttendanceRes.data?.data?.totalCheckIns === 'number' &&
      typeof analyticsAttendanceRes.data?.data?.currentlyCheckedIn === 'number'
  );

  // 44. M13 Retention: Expiration Buckets & Plan Distribution (200 OK)
  const retentionRes = await apiRequest('/api/analytics/membership-retention?daysAhead=30', 'GET', undefined, adminToken);
  recordTest(
    '44. M13 Retention: Expiration Buckets & Plan Distribution (200 OK)',
    retentionRes.status,
    200,
    retentionRes.data?.success === true &&
      typeof retentionRes.data?.data?.currentlyActiveCount === 'number' &&
      typeof retentionRes.data?.data?.expiringBuckets?.within7Days === 'number' &&
      typeof retentionRes.data?.data?.cumulativeExpiring?.expiringIn30Days === 'number' &&
      Array.isArray(retentionRes.data?.data?.planDistribution)
  );

  // 45. M13 Consistency: Dashboard Gross Revenue === Revenue Endpoint Gross Revenue
  recordTest(
    '45. M13 Consistency: Dashboard Gross Revenue === Revenue Endpoint Gross',
    revenueMtdRes.status === 200 && dashboardRes.status === 200 ? 200 : 500,
    200,
    dashboardRes.data?.data?.revenue?.mtd?.grossRevenue === revenueMtdRes.data?.data?.grossRevenue
  );

  // 46. M13 Consistency: Dashboard Refunds & Net Revenue === Revenue Endpoint Net
  recordTest(
    '46. M13 Consistency: Dashboard Refunds & Net Revenue === Revenue Endpoint Net',
    revenueMtdRes.status === 200 && dashboardRes.status === 200 ? 200 : 500,
    200,
    dashboardRes.data?.data?.revenue?.mtd?.refundedAmount === revenueMtdRes.data?.data?.refundedAmount &&
      dashboardRes.data?.data?.revenue?.mtd?.netRevenue === revenueMtdRes.data?.data?.netRevenue
  );

  // 47. M13 Consistency: Dashboard Today CheckIns === Attendance Endpoint CheckIns
  recordTest(
    '47. M13 Consistency: Dashboard Today CheckIns === Attendance Endpoint CheckIns',
    analyticsAttendanceRes.status === 200 && dashboardRes.status === 200 ? 200 : 500,
    200,
    dashboardRes.data?.data?.attendance?.todayCheckIns === analyticsAttendanceRes.data?.data?.totalCheckIns &&
      dashboardRes.data?.data?.attendance?.currentlyCheckedIn === analyticsAttendanceRes.data?.data?.currentlyCheckedIn
  );

  // 48. M13 Security: Member Role Access Denied (403 Forbidden)
  const memberDeniedAnalytics = await apiRequest('/api/analytics/dashboard', 'GET', undefined, memberToken);
  recordTest(
    '48. M13 Security: Member Role Access Denied (403 Forbidden)',
    memberDeniedAnalytics.status,
    403,
    memberDeniedAnalytics.data?.success === false
  );

  // 49. M13 Security: Unauthenticated Access Denied (401 Unauthorized)
  const unauthAnalytics = await apiRequest('/api/analytics/dashboard', 'GET');
  recordTest(
    '49. M13 Security: Unauthenticated Access Denied (401 Unauthorized)',
    unauthAnalytics.status,
    401,
    unauthAnalytics.data?.success === false
  );

  } finally {
    if (ownServer && server) {
      server.close();
      await dbConnection.disconnect();
      console.log('[Tier A Teardown] In-process test server closed cleanly.');
    }
  }

  let passed = results.filter((r) => r.passed).length;
  let failed = results.filter((r) => !r.passed).length;
  console.log(`\n=== TIER A COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);

  return { passed, failed, results };
}

// Direct execution support
if (require.main === module) {
  runTierATests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
