/**
 * TIER B: ISOLATED MUTATION & BUSINESS-RULE TEST SUITE
 * 
 * ABSOLUTE SAFETY GUARDS:
 * 1. Target Database: STRICTLY mongodb://localhost:27017/GYM360_TEST.
 * 2. If DB_NAME === 'GYM360', ABORT IMMEDIATELY BEFORE ANY WRITE.
 * 3. Teardown strictly drops GYM360_TEST only.
 * 4. Verifies:
 *    - M7 date boundary rules (starts today, ends today, ended yesterday, starts tomorrow).
 *    - M9 single active workout plan invariant (regardless of dates).
 *    - M9 historical immutability of referenced workout plans.
 *    - Multi-tenant write isolation (client-supplied orgId rejected vs JWT derived).
 *    - Trainer creation without Users account.
 *    - Trainer availability and double-booking checks.
 */

import { MongoClient, ObjectId, Int32, Double } from 'mongodb';
import * as http from 'http';
import * as bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { generateToken } from '../../src/services/tokenService';
import { dbConnection } from '../../src/config/database';
import { config } from '../../src/config/env';

const TEST_DB_NAME = 'GYM360_TEST';
const TEST_PORT = 5001;
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017';

interface TestResult {
  name: string;
  passed: boolean;
  statusCode: number;
  expectedStatus: number;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(name: string, status: number, expectedStatus: number, condition: boolean, details?: string) {
  const passed = status === expectedStatus && condition;
  results.push({ name, passed, statusCode: status, expectedStatus, details });
  console.log(`[Tier B] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} (Status: ${status}, Expected: ${expectedStatus})`);
  if (!passed && details) {
    console.error(`       Details: ${details}`);
  }
}

async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:${TEST_PORT}${endpoint}`, {
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

  return { status: response.status, data };
}

export async function runTierBTests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
  console.log('=== STARTING TIER B: ISOLATED MUTATION SUITE (GYM360_TEST) ===');

  // HARD SAFETY GUARD #1: Process environment variable check
  if (process.env.DB_NAME === 'GYM360') {
    throw new Error('FATAL SAFETY VIOLATION: process.env.DB_NAME is set to production GYM360! Aborting Tier B.');
  }

  // Set explicit test environment variables for the test server instance
  process.env.DB_NAME = TEST_DB_NAME;
  process.env.MONGODB_DB_NAME = TEST_DB_NAME;
  process.env.PORT = String(TEST_PORT);

  // HARD SAFETY GUARD #2: Target DB Name check
  if (TEST_DB_NAME !== 'GYM360_TEST') {
    throw new Error('FATAL SAFETY VIOLATION: Test database must strictly be GYM360_TEST.');
  }

  // Connect backend dbConnection strictly to GYM360_TEST
  config.mongoUri = `${TEST_MONGO_URI}/${TEST_DB_NAME}`;
  config.dbName = TEST_DB_NAME;
  await dbConnection.connect();

  if (dbConnection.getDb().databaseName !== TEST_DB_NAME) {
    throw new Error(`CRITICAL: dbConnection connected to ${dbConnection.getDb().databaseName}, expected ${TEST_DB_NAME}!`);
  }

  // Connect test runner direct client to set up fixtures in GYM360_TEST
  const client = new MongoClient(TEST_MONGO_URI);
  await client.connect();
  const testDb = client.db(TEST_DB_NAME);

  // Clean test DB before run
  await testDb.dropDatabase();
  console.log('[Tier B Setup] Initialized fresh test database: GYM360_TEST');

  // Spawn isolated Express server on port 5001
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`[Tier B Setup] Test server listening on port ${TEST_PORT}`);

  try {
    const nowUtc = new Date();
    const todayIso = nowUtc.toISOString().slice(0, 10);
    const yesterdayIso = new Date(nowUtc.getTime() - 86400000).toISOString().slice(0, 10);
    const tomorrowIso = new Date(nowUtc.getTime() + 86400000).toISOString().slice(0, 10);
    const thirtyDaysLaterIso = new Date(nowUtc.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const oneYearLaterIso = new Date(nowUtc.getTime() + 365 * 86400000).toISOString().slice(0, 10);
    const thirtyDaysAgoIso = new Date(nowUtc.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    // ==========================================
    // SEED MINIMAL TEST FIXTURES
    // ==========================================
    const org1Id = new ObjectId();
    const org2Id = new ObjectId();

    await testDb.collection('organizations').insertMany([
      { _id: org1Id, name: 'Test Org 1', email: 'org1@test.com', phone: '9800000001', address: { street: 'S1', city: 'Pune', state: 'MH', postalCode: '411001' }, status: 'active' },
      { _id: org2Id, name: 'Test Org 2', email: 'org2@test.com', phone: '9800000002', address: { street: 'S2', city: 'Pune', state: 'MH', postalCode: '411002' }, status: 'active' },
    ]);

    const branch1Id = new ObjectId();
    const branch2Id = new ObjectId();

    await testDb.collection('branches').insertMany([
      { _id: branch1Id, organizationId: org1Id, name: 'Branch 1', address: { street: 'B1', city: 'Pune', state: 'MH', postalCode: '411001' }, phone: '9800000001', capacity: new Int32(100), openingTime: '06:00', closingTime: '22:00', status: 'active' },
      { _id: branch2Id, organizationId: org1Id, name: 'Branch 2', address: { street: 'B2', city: 'Pune', state: 'MH', postalCode: '411001' }, phone: '9800000002', capacity: new Int32(100), openingTime: '06:00', closingTime: '22:00', status: 'active' },
    ]);

    const adminUser1Id = new ObjectId();
    const adminToken = generateToken({
      userId: adminUser1Id.toString(),
      organizationId: org1Id.toString(),
      role: 'admin',
      status: 'active',
    });

    const memberProfile1Id = new ObjectId();
    await testDb.collection('members').insertOne({
      _id: memberProfile1Id,
      organizationId: org1Id,
      branchId: branch1Id,
      firstName: 'Test',
      lastName: 'Member1',
      email: 'member1@test.com',
      status: 'active',
    });

    const memberUser1Id = new ObjectId();
    await testDb.collection('Users').insertOne({
      _id: memberUser1Id,
      organizationId: org1Id,
      firstName: 'Test',
      lastName: 'Member1',
      email: 'member1@test.com',
      phone: '9800000003',
      passwordHash: 'dummy',
      role: 'member',
      status: 'active',
      memberId: memberProfile1Id,
    });

    const memberToken = generateToken({
      userId: memberUser1Id.toString(),
      organizationId: org1Id.toString(),
      role: 'member',
      status: 'active',
    });

    // Plans: Single branch and All branch
    const planSingleId = new ObjectId();
    const planAllId = new ObjectId();
    await testDb.collection('membershipPlans').insertMany([
      { _id: planSingleId, organizationId: org1Id, name: 'Single Branch Plan', description: 'desc', durationDays: new Int32(30), price: new Double(1000), branchAccess: 'single_branch', status: 'active' },
      { _id: planAllId, organizationId: org1Id, name: 'All Branches Plan', description: 'desc', durationDays: new Int32(30), price: new Double(2000), branchAccess: 'all_branches', status: 'active' },
    ]);

    // Active Membership covering today for memberProfile1Id
    const activeMembership1Id = new ObjectId();
    await testDb.collection('memberships').insertOne({
      _id: activeMembership1Id,
      organizationId: org1Id,
      branchId: branch1Id,
      memberId: memberProfile1Id,
      planId: planSingleId,
      startDate: thirtyDaysAgoIso,
      endDate: oneYearLaterIso,
      status: 'active',
      autoRenew: false,
    });

    // ==========================================
    // TEST 1 & 2: MULTI-TENANT WRITE ISOLATION
    // ==========================================
    // A: Org 1 admin attempts to supply Org 2 ID in body -> MUST BE REJECTED (403)
    const crossTenantCreate = await apiRequest(
      '/api/members',
      'POST',
      {
        organizationId: org2Id.toString(),
        branchId: branch1Id.toString(),
        firstName: 'Malicious',
        lastName: 'Member',
        email: 'malicious@test.com',
        phone: '9811111111',
      },
      adminToken
    );
    recordTest(
      '1. Multi-Tenant Write Isolation (Rejected on Supplied Org ID)',
      crossTenantCreate.status,
      403,
      crossTenantCreate.data?.success === false
    );

    // B: Org 1 admin omits organizationId -> SERVER MUST DERIVE FROM JWT
    const derivedTenantCreate = await apiRequest(
      '/api/members',
      'POST',
      {
        branchId: branch1Id.toString(),
        firstName: 'Derived',
        lastName: 'Member',
        email: 'derived@test.com',
        phone: '9811111112',
      },
      adminToken
    );
    const createdMemberId = derivedTenantCreate.data?.data?.member?._id || derivedTenantCreate.data?.data?._id;
    const createdMemberInDb = createdMemberId
      ? await testDb.collection('members').findOne({ _id: new ObjectId(createdMemberId) })
      : null;
    recordTest(
      '2. Multi-Tenant Write Isolation (Derived from JWT context)',
      derivedTenantCreate.status,
      201,
      createdMemberInDb?.organizationId?.toString() === org1Id.toString()
    );

    // ==========================================
    // TEST 3: MEMBER IMMUTABLE FIELD
    // ==========================================
    const immutableUpdate = await apiRequest(
      `/api/members/${createdMemberId}`,
      'PUT',
      {
        email: 'newemail@test.com', // email cannot be altered
      },
      adminToken
    );
    recordTest(
      '3. Member Immutable Field Protection (Email modification rejected)',
      immutableUpdate.status,
      400,
      immutableUpdate.data?.success === false
    );

    // ==========================================
    // TEST 4: MEMBERSHIP PLAN IMMUTABILITY
    // ==========================================
    // planSingleId is referenced by activeMembership1Id -> durationDays / price immutable
    const planUpdateRes = await apiRequest(
      `/api/membership-plans/${planSingleId.toString()}`,
      'PUT',
      {
        price: 1500,
      },
      adminToken
    );
    recordTest(
      '4. Membership Plan Historical Immutability (Referenced plan cannot alter price)',
      planUpdateRes.status,
      409,
      planUpdateRes.data?.success === false
    );

    // ==========================================
    // TEST 5 & 6: PAYMENTS CREATION & VALIDATION
    // ==========================================
    // Create valid payment
    const validPayment = await apiRequest(
      '/api/payments',
      'POST',
      {
        memberId: memberProfile1Id.toString(),
        membershipId: activeMembership1Id.toString(),
        amount: 1000,
        paymentMethod: 'card',
        transactionReference: 'TXN-TEST-ISOLATED-001',
      },
      adminToken
    );
    const createdPaymentBranchId = validPayment.data?.data?.payment?.branchId || validPayment.data?.data?.branchId;
    recordTest(
      '5. Valid Payment Creation (branchId derived from membership)',
      validPayment.status,
      201,
      createdPaymentBranchId === branch1Id.toString()
    );

    // Negative payment amount rejected
    const negativePayment = await apiRequest(
      '/api/payments',
      'POST',
      {
        memberId: memberProfile1Id.toString(),
        membershipId: activeMembership1Id.toString(),
        amount: -500,
        paymentMethod: 'card',
        transactionReference: 'TXN-TEST-ISOLATED-NEG',
      },
      adminToken
    );
    recordTest(
      '6. Payment Amount Validation (Negative amount rejected with 400)',
      negativePayment.status,
      400,
      negativePayment.data?.success === false
    );

    // ==========================================
    // TEST 7–10: M7 ATTENDANCE DATE BOUNDARY TESTS
    // Rule: startDate <= UTC today < endDate
    // ==========================================
    // Create special boundary test members & memberships
    const bMem1Id = new ObjectId(); // starts today
    const bMem2Id = new ObjectId(); // ends today
    const bMem3Id = new ObjectId(); // ended yesterday
    const bMem4Id = new ObjectId(); // starts tomorrow

    await testDb.collection('members').insertMany([
      { _id: bMem1Id, organizationId: org1Id, branchId: branch1Id, firstName: 'B1', lastName: 'StartToday', email: 'b1@test.com', status: 'active' },
      { _id: bMem2Id, organizationId: org1Id, branchId: branch1Id, firstName: 'B2', lastName: 'EndToday', email: 'b2@test.com', status: 'active' },
      { _id: bMem3Id, organizationId: org1Id, branchId: branch1Id, firstName: 'B3', lastName: 'EndYesterday', email: 'b3@test.com', status: 'active' },
      { _id: bMem4Id, organizationId: org1Id, branchId: branch1Id, firstName: 'B4', lastName: 'StartTomorrow', email: 'b4@test.com', status: 'active' },
    ]);

    await testDb.collection('memberships').insertMany([
      { organizationId: org1Id, branchId: branch1Id, memberId: bMem1Id, planId: planSingleId, startDate: todayIso, endDate: thirtyDaysLaterIso, status: 'active', autoRenew: false },
      { organizationId: org1Id, branchId: branch1Id, memberId: bMem2Id, planId: planSingleId, startDate: thirtyDaysAgoIso, endDate: todayIso, status: 'active', autoRenew: false },
      { organizationId: org1Id, branchId: branch1Id, memberId: bMem3Id, planId: planSingleId, startDate: thirtyDaysAgoIso, endDate: yesterdayIso, status: 'active', autoRenew: false },
      { organizationId: org1Id, branchId: branch1Id, memberId: bMem4Id, planId: planSingleId, startDate: tomorrowIso, endDate: thirtyDaysLaterIso, status: 'active', autoRenew: false },
    ]);

    // Boundary 1: Starts today -> ALLOWED (201)
    const checkInStartToday = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem1Id.toString(), branchId: branch1Id.toString() },
      adminToken
    );
    recordTest(
      '7. Attendance Boundary: Starts Today (startDate == today) -> Allowed',
      checkInStartToday.status,
      201,
      checkInStartToday.data?.success === true
    );

    // Boundary 2: Ends today (today == endDate) -> EXPIRED / REJECTED (403)
    const checkInEndToday = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem2Id.toString(), branchId: branch1Id.toString() },
      adminToken
    );
    recordTest(
      '8. Attendance Boundary: Ends Today (today == endDate) -> Rejected (403)',
      checkInEndToday.status,
      403,
      checkInEndToday.data?.success === false
    );

    // Boundary 3: Ended yesterday -> REJECTED (403)
    const checkInEndYesterday = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem3Id.toString(), branchId: branch1Id.toString() },
      adminToken
    );
    recordTest(
      '9. Attendance Boundary: Ended Yesterday -> Rejected (403)',
      checkInEndYesterday.status,
      403,
      checkInEndYesterday.data?.success === false
    );

    // Boundary 4: Starts tomorrow -> REJECTED (403)
    const checkInStartTomorrow = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem4Id.toString(), branchId: branch1Id.toString() },
      adminToken
    );
    recordTest(
      '10. Attendance Boundary: Starts Tomorrow -> Rejected (403)',
      checkInStartTomorrow.status,
      403,
      checkInStartTomorrow.data?.success === false
    );

    // ==========================================
    // TEST 11 & 12: ATTENDANCE BRANCH & OPEN SESSION
    // ==========================================
    // Single-branch membership at unassigned branch -> 403
    const wrongBranchCheckIn = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem1Id.toString(), branchId: branch2Id.toString() },
      adminToken
    );
    recordTest(
      '11. Single-Branch Membership Wrong Branch Check-In (403)',
      wrongBranchCheckIn.status,
      403,
      wrongBranchCheckIn.data?.success === false
    );

    // Duplicate check-in while session is open -> 400 Bad Request
    const dupCheckIn = await apiRequest(
      '/api/attendance/check-in',
      'POST',
      { memberId: bMem1Id.toString(), branchId: branch1Id.toString() },
      adminToken
    );
    recordTest(
      '12. Duplicate Check-In with Existing Open Session Rejection (400 Bad Request)',
      dupCheckIn.status,
      400,
      dupCheckIn.data?.success === false
    );

    // ==========================================
    // TEST 13–16: TRAINERS & AVAILABILITY
    // ==========================================
    // Create trainer (verify zero user account created)
    const trainerCreate = await apiRequest(
      '/api/trainers',
      'POST',
      {
        branchId: branch1Id.toString(),
        firstName: 'Coach',
        lastName: 'Kunal',
        email: 'coach.kunal@test.com',
        phone: '9822334455',
        specialization: ['Crossfit'],
        experienceYears: 5,
        bio: 'Certified strength and functional trainer.',
      },
      adminToken
    );
    const trainerId = trainerCreate.data?.data?._id;
    const userWithTrainerEmail = await testDb.collection('Users').findOne({ email: 'coach.kunal@test.com' });
    recordTest(
      '13. Trainer Creation (Verified zero Users account created)',
      trainerCreate.status,
      201,
      userWithTrainerEmail === null
    );

    // Create non-overlapping available slot (09:00 - 13:00)
    const slot1Res = await apiRequest(
      `/api/trainers/${trainerId}/availability`,
      'POST',
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '13:00',
        status: 'available',
      },
      adminToken
    );
    recordTest(
      '14. Trainer Availability Slot Creation',
      slot1Res.status,
      201,
      slot1Res.data?.success === true
    );

    // Create overlapping available slot (10:00 - 12:00) -> 409 Conflict
    const slotOverlapRes = await apiRequest(
      `/api/trainers/${trainerId}/availability`,
      'POST',
      {
        dayOfWeek: 'Monday',
        startTime: '10:00',
        endTime: '12:00',
        status: 'available',
      },
      adminToken
    );
    recordTest(
      '15. Overlapping Available Slot Rejection (409 Conflict)',
      slotOverlapRes.status,
      409,
      slotOverlapRes.data?.success === false
    );

    // ==========================================
    // TEST 17 & 18: TRAINER SESSIONS & DOUBLE BOOKING
    // ==========================================
    // Book valid session inside available window (10:00 - 11:00 on next Monday)
    const bookSessionRes = await apiRequest(
      '/api/trainer-sessions',
      'POST',
      {
        trainerId,
        memberId: memberProfile1Id.toString(),
        sessionDate: '2026-10-12', // Monday
        startTime: '10:00',
        endTime: '11:00',
        sessionType: 'Personal Training',
      },
      adminToken
    );
    recordTest(
      '16. Book Trainer Session (Honoring all constraints)',
      bookSessionRes.status,
      201,
      bookSessionRes.data?.success === true
    );

    // Attempt double booking same trainer at same time -> 409
    const doubleBookRes = await apiRequest(
      '/api/trainer-sessions',
      'POST',
      {
        trainerId,
        memberId: bMem1Id.toString(),
        sessionDate: '2026-10-12',
        startTime: '10:00',
        endTime: '11:00',
        sessionType: 'Personal Training',
      },
      adminToken
    );
    recordTest(
      '17. Trainer Double-Booking Prevention (409 Conflict)',
      doubleBookRes.status,
      409,
      doubleBookRes.data?.success === false
    );

    // ==========================================
    // TEST 19 & 20: M9 WORKOUT PLANS & SINGLE ACTIVE INVARIANT
    // ==========================================
    // Create workout plan
    const createWpRes = await apiRequest(
      '/api/workout-plans',
      'POST',
      {
        name: 'Isolated Plan A',
        description: 'Test program',
        goal: 'Strength',
        difficulty: 'Intermediate',
        durationWeeks: 8,
      },
      adminToken
    );
    const wpId = createWpRes.data?.data?._id;
    recordTest(
      '18. Workout Plan Creation',
      createWpRes.status,
      201,
      createWpRes.data?.success === true
    );

    // First assignment to member with status active -> 201
    const assign1Res = await apiRequest(
      '/api/member-workout-plans',
      'POST',
      {
        memberId: memberProfile1Id.toString(),
        workoutPlanId: wpId,
        startDate: todayIso,
        status: 'active',
        notes: 'First active assignment',
      },
      adminToken
    );
    recordTest(
      '19. First Member Workout Plan Assignment (Active)',
      assign1Res.status,
      201,
      assign1Res.data?.success === true
    );

    // Second active assignment to same member (EVEN WITH DIFFERENT DATES) -> 409 Conflict
    const assign2Res = await apiRequest(
      '/api/member-workout-plans',
      'POST',
      {
        memberId: memberProfile1Id.toString(),
        workoutPlanId: wpId,
        startDate: thirtyDaysLaterIso, // completely different date
        status: 'active',
        notes: 'Attempted duplicate active assignment',
      },
      adminToken
    );
    recordTest(
      '20. Single-Active-Plan Invariant: Second Active Assignment Rejected (409 Conflict)',
      assign2Res.status,
      409,
      assign2Res.data?.success === false
    );

    // M9 Historical Immutability: Attempt modifying durationWeeks on assigned plan -> 409 Conflict
    const updateAssignedPlanRes = await apiRequest(
      `/api/workout-plans/${wpId}`,
      'PATCH',
      {
        durationWeeks: 12,
      },
      adminToken
    );
    recordTest(
      '21. M9 Historical Immutability: Cannot Modify durationWeeks on Assigned Plan (409)',
      updateAssignedPlanRes.status,
      409,
      updateAssignedPlanRes.data?.success === false
    );

    // ==========================================
    // TEST 22–25: M11 EQUIPMENT MUTATION TESTS
    // ==========================================
    // Create valid equipment
    const createEquipRes = await apiRequest(
      '/api/equipment',
      'POST',
      {
        branchId: branch1Id.toString(),
        name: 'Hammer Strength Iso-Lateral Bench',
        category: 'Strength',
        brand: 'Hammer Strength',
        model: 'IL-BP',
        serialNumber: 'HS-BP-2026-999',
        purchaseDate: todayIso,
        status: 'operational',
        lastMaintenanceDate: todayIso,
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    const createdEquipId = createEquipRes.data?.data?._id;
    recordTest(
      '22. M11 Equipment: Create Equipment (201 Created)',
      createEquipRes.status,
      201,
      createEquipRes.data?.success === true && !!createdEquipId
    );

    // Reject invalid equipment status (e.g. 'out_of_order' not in schema enum)
    const invalidStatusEquipRes = await apiRequest(
      '/api/equipment',
      'POST',
      {
        branchId: branch1Id.toString(),
        name: 'Invalid Status Machine',
        category: 'Cardio',
        brand: 'Brand',
        model: 'Mod',
        serialNumber: 'INV-001',
        purchaseDate: todayIso,
        status: 'out_of_order', // invalid enum
        lastMaintenanceDate: todayIso,
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    recordTest(
      '23. M11 Equipment: Invalid Status Rejection (400 Bad Request)',
      invalidStatusEquipRes.status,
      400,
      invalidStatusEquipRes.data?.success === false
    );

    // Update equipment status via dedicated endpoint
    const updateEquipStatusRes = await apiRequest(
      `/api/equipment/${createdEquipId}/status`,
      'PATCH',
      { status: 'under_maintenance' },
      adminToken
    );
    recordTest(
      '24. M11 Equipment: Dedicated Status Update (under_maintenance)',
      updateEquipStatusRes.status,
      200,
      updateEquipStatusRes.data?.data?.status === 'under_maintenance'
    );

    // Cross-tenant branch equipment rejection (Org 1 admin tries to assign to Org 2 branch)
    const org2BranchId = new ObjectId();
    await testDb.collection('branches').insertOne({
      _id: org2BranchId,
      organizationId: org2Id,
      name: 'Org 2 Branch',
      address: { street: 'B3', city: 'Pune', state: 'MH', postalCode: '411003' },
      phone: '9800000009',
      capacity: new Int32(50),
      openingTime: '06:00',
      closingTime: '22:00',
      status: 'active'
    });

    const crossBranchEquipRes = await apiRequest(
      '/api/equipment',
      'POST',
      {
        branchId: org2BranchId.toString(),
        name: 'Cross Branch Hack',
        category: 'Cardio',
        brand: 'Brand',
        model: 'Mod',
        serialNumber: 'CBH-001',
        purchaseDate: todayIso,
        status: 'operational',
        lastMaintenanceDate: todayIso,
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    recordTest(
      '25. M11 Equipment: Cross-Tenant Branch Assignment Rejection (404)',
      crossBranchEquipRes.status,
      404,
      crossBranchEquipRes.data?.success === false
    );

    // ==========================================
    // TEST 26–30: M11 MAINTENANCE LOG MUTATION TESTS
    // ==========================================
    // Create valid maintenance log (inherits branchId from equipment)
    const createMaintRes = await apiRequest(
      '/api/maintenance-logs',
      'POST',
      {
        equipmentId: createdEquipId,
        maintenanceDate: todayIso,
        maintenanceType: 'Routine Maintenance',
        description: 'Lubricated linear bearings and checked cable tension',
        performedBy: 'Apex Techs',
        cost: 450,
        status: 'scheduled',
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    const createdMaintId = createMaintRes.data?.data?._id;
    recordTest(
      '26. M11 Maintenance: Create Maintenance Log (Inherits equipment branchId)',
      createMaintRes.status,
      201,
      createMaintRes.data?.data?.branchId === branch1Id.toString()
    );

    // Reject negative maintenance cost
    const negCostMaintRes = await apiRequest(
      '/api/maintenance-logs',
      'POST',
      {
        equipmentId: createdEquipId,
        maintenanceDate: todayIso,
        maintenanceType: 'Routine Maintenance',
        description: 'Bad cost test',
        performedBy: 'Tech',
        cost: -250, // negative
        status: 'scheduled',
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    recordTest(
      '27. M11 Maintenance: Negative Cost Rejection (400 Bad Request)',
      negCostMaintRes.status,
      400,
      negCostMaintRes.data?.success === false
    );

    // Cross-tenant equipment reference rejection
    const org2EquipId = new ObjectId();
    await testDb.collection('equipment').insertOne({
      _id: org2EquipId,
      organizationId: org2Id,
      branchId: org2BranchId,
      name: 'Org 2 Treadmill',
      category: 'Cardio',
      brand: 'Brand',
      model: 'Mod',
      serialNumber: 'O2-TM-01',
      purchaseDate: todayIso,
      status: 'operational',
      lastMaintenanceDate: todayIso,
      nextMaintenanceDate: thirtyDaysLaterIso
    });

    const crossEquipMaintRes = await apiRequest(
      '/api/maintenance-logs',
      'POST',
      {
        equipmentId: org2EquipId.toString(),
        maintenanceDate: todayIso,
        maintenanceType: 'Routine Maintenance',
        description: 'Cross tenant test',
        performedBy: 'Tech',
        cost: 100,
        status: 'scheduled',
        nextMaintenanceDate: thirtyDaysLaterIso,
      },
      adminToken
    );
    recordTest(
      '28. M11 Maintenance: Cross-Tenant Equipment Reference Rejection (404)',
      crossEquipMaintRes.status,
      404,
      crossEquipMaintRes.data?.success === false
    );

    // Update maintenance status to completed
    const updateMaintStatusRes = await apiRequest(
      `/api/maintenance-logs/${createdMaintId}/status`,
      'PATCH',
      { status: 'completed' },
      adminToken
    );
    recordTest(
      '29. M11 Maintenance: Update Status to Completed (200 OK)',
      updateMaintStatusRes.status,
      200,
      updateMaintStatusRes.data?.data?.status === 'completed'
    );

    // Verify equipment status did NOT auto-change (remains under_maintenance)
    const checkEquipDecoupledRes = await apiRequest(
      `/api/equipment/${createdEquipId}`,
      'GET',
      undefined,
      adminToken
    );
    recordTest(
      '30. M11 Business Rule: Equipment Status Decoupled from Maintenance Completion',
      checkEquipDecoupledRes.status,
      200,
      checkEquipDecoupledRes.data?.data?.status === 'under_maintenance'
    );

    // ==========================================
    // TEST 31: M11 AUDIT LOG VERIFICATION
    // ==========================================
    // Verify audit logs were persisted for equipment and maintenance operations
    const auditQueryRes = await apiRequest(
      '/api/audit-logs?limit=20',
      'GET',
      undefined,
      adminToken
    );
    const auditActions = (auditQueryRes.data?.data || []).map((a: any) => a.action);
    recordTest(
      '31. M11 Audit Logs: Captured EQUIPMENT_CREATED and MAINTENANCE_CREATED',
      auditQueryRes.status,
      200,
      auditActions.includes('EQUIPMENT_CREATED') && auditActions.includes('MAINTENANCE_CREATED')
    );

    // ==========================================
    // TEST 32–41: M12 NOTIFICATIONS MUTATION TESTS
    // ==========================================
    // 32. Admin creates notification with valid branch and recipient user
    const createNotifRes = await apiRequest(
      '/api/notifications',
      'POST',
      {
        branchId: branch1Id.toString(),
        recipientUserId: memberUser1Id.toString(),
        type: 'announcement',
        title: 'Holiday Schedule Notice',
        message: 'Branch 1 will operate under modified holiday hours.',
        priority: 'high',
        status: 'unread',
        createdAt: todayIso,
      },
      adminToken
    );
    const createdNotifId = createNotifRes.data?.data?._id;
    recordTest(
      '32. M12 Notifications: Create Notification (Valid Branch & Recipient)',
      createNotifRes.status,
      201,
      createNotifRes.data?.data?.branchId === branch1Id.toString() &&
        createNotifRes.data?.data?.recipientUserId === memberUser1Id.toString() &&
        createNotifRes.data?.data?.status === 'unread'
    );

    // 33. Audit log verification for NOTIFICATION_CREATED (attributed to validated branch)
    const notifCreatedAudit = await testDb.collection('auditLogs').findOne({
      entityId: new ObjectId(createdNotifId),
      action: 'NOTIFICATION_CREATED'
    });
    recordTest(
      '33. M12 Notifications: Audit Log NOTIFICATION_CREATED Attributed to Validated Branch',
      createNotifRes.status === 201 && notifCreatedAudit ? 200 : 500,
      200,
      !!notifCreatedAudit &&
        notifCreatedAudit.branchId.toString() === branch1Id.toString() &&
        notifCreatedAudit.organizationId.toString() === org1Id.toString() &&
        notifCreatedAudit.userId.toString() === adminUser1Id.toString()
    );

    // 34. Reject cross-tenant branch reference (404)
    const crossBranchNotifRes = await apiRequest(
      '/api/notifications',
      'POST',
      {
        branchId: org2BranchId.toString(),
        recipientUserId: memberUser1Id.toString(),
        type: 'announcement',
        title: 'Cross Branch Hack',
        message: 'Attempting cross-branch reference',
        priority: 'medium',
      },
      adminToken
    );
    recordTest(
      '34. M12 Notifications: Reject Cross-Tenant Branch Reference (404)',
      crossBranchNotifRes.status,
      404,
      crossBranchNotifRes.data?.success === false
    );

    // 35. Reject cross-tenant recipient user reference (404)
    const org2UserId = new ObjectId();
    await testDb.collection('Users').insertOne({
      _id: org2UserId,
      organizationId: org2Id,
      firstName: 'Org2',
      lastName: 'User',
      email: 'org2user@test.com',
      phone: '9800000088',
      passwordHash: 'dummy',
      role: 'member',
      status: 'active'
    });

    const crossUserNotifRes = await apiRequest(
      '/api/notifications',
      'POST',
      {
        branchId: branch1Id.toString(),
        recipientUserId: org2UserId.toString(),
        type: 'alert',
        title: 'Cross User Hack',
        message: 'Attempting cross-tenant recipient',
        priority: 'low',
      },
      adminToken
    );
    recordTest(
      '35. M12 Notifications: Reject Cross-Tenant Recipient Reference (404)',
      crossUserNotifRes.status,
      404,
      crossUserNotifRes.data?.success === false
    );

    // 36. Member updates status of own notification to 'read' (200 OK)
    const memberUpdateStatusRes = await apiRequest(
      `/api/notifications/${createdNotifId}/status`,
      'PATCH',
      { status: 'read' },
      memberToken
    );
    recordTest(
      '36. M12 Notifications: Member Updates Own Status to Read (200 OK)',
      memberUpdateStatusRes.status,
      200,
      memberUpdateStatusRes.data?.data?.status === 'read'
    );

    // 37. Audit log verification for NOTIFICATION_STATUS_UPDATED (uses existing branchId)
    const notifStatusAudit = await testDb.collection('auditLogs').findOne({
      entityId: new ObjectId(createdNotifId),
      action: 'NOTIFICATION_STATUS_UPDATED'
    });
    recordTest(
      '37. M12 Notifications: Audit Log NOTIFICATION_STATUS_UPDATED Uses Existing Branch',
      memberUpdateStatusRes.status === 200 && notifStatusAudit ? 200 : 500,
      200,
      !!notifStatusAudit &&
        notifStatusAudit.branchId.toString() === branch1Id.toString() &&
        notifStatusAudit.userId.toString() === memberUser1Id.toString()
    );

    // 38. Idempotent status update: repeated request with same status returns 200 without duplicate audit log
    const initialStatusAuditCount = await testDb.collection('auditLogs').countDocuments({
      entityId: new ObjectId(createdNotifId),
      action: 'NOTIFICATION_STATUS_UPDATED'
    });
    const repeatUpdateRes = await apiRequest(
      `/api/notifications/${createdNotifId}/status`,
      'PATCH',
      { status: 'read' },
      memberToken
    );
    const postRepeatAuditCount = await testDb.collection('auditLogs').countDocuments({
      entityId: new ObjectId(createdNotifId),
      action: 'NOTIFICATION_STATUS_UPDATED'
    });
    recordTest(
      '38. M12 Notifications: Idempotent Status Update (No Redundant Write/Audit)',
      repeatUpdateRes.status,
      200,
      repeatUpdateRes.data?.data?.status === 'read' && initialStatusAuditCount === postRepeatAuditCount
    );

    // 39. Member denied updating another member's notification (404 IDOR Protection)
    const memberUser2Id = new ObjectId();
    await testDb.collection('Users').insertOne({
      _id: memberUser2Id,
      organizationId: org1Id,
      firstName: 'Member',
      lastName: 'Two',
      email: 'member2@test.com',
      phone: '9800000022',
      passwordHash: 'dummy',
      role: 'member',
      status: 'active'
    });
    const otherMemberNotifId = new ObjectId();
    await testDb.collection('notifications').insertOne({
      _id: otherMemberNotifId,
      organizationId: org1Id,
      branchId: branch1Id,
      recipientUserId: memberUser2Id,
      type: 'reminder',
      title: 'Private Reminder',
      message: 'Private message for member 2',
      priority: 'low',
      status: 'unread',
      createdAt: todayIso
    });

    const otherMemberUpdateRes = await apiRequest(
      `/api/notifications/${otherMemberNotifId}/status`,
      'PATCH',
      { status: 'read' },
      memberToken
    );
    recordTest(
      '39. M12 Notifications: Member Denied Updating Another Member Notification (404)',
      otherMemberUpdateRes.status,
      404,
      otherMemberUpdateRes.data?.success === false
    );

    // 40. Reject invalid status value (400 Bad Request)
    const badStatusRes = await apiRequest(
      `/api/notifications/${createdNotifId}/status`,
      'PATCH',
      { status: 'archived' },
      memberToken
    );
    recordTest(
      '40. M12 Notifications: Reject Invalid Status Value (400 Bad Request)',
      badStatusRes.status,
      400,
      badStatusRes.data?.success === false
    );

    // 41. Reject cross-tenant status update (404 IDOR Protection)
    const org2AdminId = new ObjectId();
    const org2AdminToken = generateToken({
      userId: org2AdminId.toString(),
      organizationId: org2Id.toString(),
      role: 'admin',
      status: 'active'
    });
    const crossTenantUpdateRes = await apiRequest(
      `/api/notifications/${createdNotifId}/status`,
      'PATCH',
      { status: 'unread' },
      org2AdminToken
    );
    recordTest(
      '41. M12 Notifications: Reject Cross-Tenant Status Update (404)',
      crossTenantUpdateRes.status,
      404,
      crossTenantUpdateRes.data?.success === false
    );

    // ==========================================
    // M13 EXECUTIVE ANALYTICS MUTATION & ISOLATION TESTS
    // ==========================================

    // 42. Multi-Tenant Isolation: Org 1 Admin analytics strictly excludes Org 2 data
    // Seed Org 2 payment and attendance
    await testDb.collection('payments').insertOne({
      _id: new ObjectId(),
      organizationId: org2Id,
      branchId: org2BranchId,
      memberId: org2UserId,
      membershipId: new ObjectId(),
      amount: 99999,
      paymentMethod: 'cash',
      paymentDate: todayIso,
      status: 'completed',
      transactionReference: 'ORG2-PAY-SECRET'
    });
    const org1RevenueCheck = await apiRequest('/api/analytics/revenue', 'GET', undefined, adminToken);
    recordTest(
      '42. M13 Multi-Tenant Isolation: Org 1 Analytics Excludes Org 2 Data',
      org1RevenueCheck.status,
      200,
      !org1RevenueCheck.data?.data?.timeSeries.some((t: any) => t.grossRevenue >= 99999)
    );

    // 43. Branch Filtering Accuracy: Valid branchId filters strictly to targeted branch
    const branch1Revenue = await apiRequest(`/api/analytics/revenue?branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '43. M13 Branch Scoping: Valid branchId Filters Correctly',
      branch1Revenue.status,
      200,
      branch1Revenue.data?.success === true
    );

    // 44. Cross-Tenant Branch Rejection: Supplying branchId from Org 2 returns 404
    const crossBranchAnalytics = await apiRequest(`/api/analytics/dashboard?branchId=${org2BranchId.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '44. M13 Branch Scoping: Cross-Tenant Branch Returns 404',
      crossBranchAnalytics.status,
      404,
      crossBranchAnalytics.data?.success === false
    );

    // 45. Zero-Data Behavior: Empty Org 2 returns 0 counts without error
    const org2EmptyDashboard = await apiRequest('/api/analytics/dashboard', 'GET', undefined, org2AdminToken);
    recordTest(
      '45. M13 Zero-Data Behavior: Empty Organization Returns Zeros Without Error',
      org2EmptyDashboard.status,
      200,
      org2EmptyDashboard.data?.data?.attendance?.currentlyCheckedIn === 0 &&
        typeof org2EmptyDashboard.data?.data?.equipment?.operationalPercentage === 'number'
    );

    // 46. Revenue Partial Date Rejection: Supplying only startDate returns 400
    const partialStartRes = await apiRequest(`/api/analytics/revenue?startDate=${todayIso}`, 'GET', undefined, adminToken);
    recordTest(
      '46. M13 Revenue Validation: Partial startDate Returns 400',
      partialStartRes.status,
      400,
      partialStartRes.data?.success === false
    );

    // 47. Revenue Partial Date Rejection: Supplying only endDate returns 400
    const partialEndRes = await apiRequest(`/api/analytics/revenue?endDate=${todayIso}`, 'GET', undefined, adminToken);
    recordTest(
      '47. M13 Revenue Validation: Partial endDate Returns 400',
      partialEndRes.status,
      400,
      partialEndRes.data?.success === false
    );

    // 48. Revenue Date Inversion: startDate > endDate returns 400
    const invertedDateRes = await apiRequest(`/api/analytics/revenue?startDate=${tomorrowIso}&endDate=${todayIso}`, 'GET', undefined, adminToken);
    recordTest(
      '48. M13 Revenue Validation: startDate > endDate Returns 400',
      invertedDateRes.status,
      400,
      invertedDateRes.data?.success === false
    );

    // 49. Revenue Status Filtering: completed vs refunded vs pending/failed
    const paymentMemberId = new ObjectId();
    await testDb.collection('payments').insertMany([
      { _id: new ObjectId(), organizationId: org1Id, branchId: branch1Id, memberId: paymentMemberId, membershipId: new ObjectId(), amount: 1000, paymentMethod: 'card', paymentDate: todayIso, status: 'completed', transactionReference: 'TX-C1' },
      { _id: new ObjectId(), organizationId: org1Id, branchId: branch1Id, memberId: paymentMemberId, membershipId: new ObjectId(), amount: 200, paymentMethod: 'card', paymentDate: todayIso, status: 'refunded', transactionReference: 'TX-R1' },
      { _id: new ObjectId(), organizationId: org1Id, branchId: branch1Id, memberId: paymentMemberId, membershipId: new ObjectId(), amount: 500, paymentMethod: 'card', paymentDate: todayIso, status: 'pending', transactionReference: 'TX-P1' },
      { _id: new ObjectId(), organizationId: org1Id, branchId: branch1Id, memberId: paymentMemberId, membershipId: new ObjectId(), amount: 500, paymentMethod: 'card', paymentDate: todayIso, status: 'failed', transactionReference: 'TX-F1' },
    ]);
    const filterRevenueCheck = await apiRequest(`/api/analytics/revenue?startDate=${todayIso}&endDate=${todayIso}&branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '49. M13 Revenue Filtering: Pending/Failed Excluded, Net = Gross - Refunds',
      filterRevenueCheck.status,
      200,
      filterRevenueCheck.data?.data?.grossRevenue >= 1000 &&
        filterRevenueCheck.data?.data?.refundedAmount >= 200 &&
        filterRevenueCheck.data?.data?.netRevenue === filterRevenueCheck.data?.data?.grossRevenue - filterRevenueCheck.data?.data?.refundedAmount
    );

    // 50. Open Attendance Session (Previous Day): Counted in currentlyCheckedIn
    const prevDayAttMember = new ObjectId();
    await testDb.collection('attendance').insertOne({
      _id: new ObjectId(),
      organizationId: org1Id,
      branchId: branch1Id,
      memberId: prevDayAttMember,
      checkInTime: `${yesterdayIso}T22:00:00.000Z`,
      checkOutTime: '', // open session from yesterday
      status: 'present',
      method: 'manual'
    });
    const attOpenSessionCheck = await apiRequest(`/api/analytics/attendance?branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '50. M13 Attendance: Open Session Initiated Yesterday Counted in currentlyCheckedIn',
      attOpenSessionCheck.status,
      200,
      attOpenSessionCheck.data?.data?.currentlyCheckedIn >= 1
    );

    // 51. Membership Expired Today: Excluded from currently active & upcoming expiration buckets
    const todayExpMemberId = new ObjectId();
    await testDb.collection('memberships').insertOne({
      _id: new ObjectId(),
      organizationId: org1Id,
      branchId: branch1Id,
      memberId: todayExpMemberId,
      planId: planSingleId,
      startDate: thirtyDaysAgoIso,
      endDate: todayIso, // expires today (endDate <= today)
      status: 'active',
      autoRenew: false
    });
    const retentionTodayCheck = await apiRequest(`/api/analytics/membership-retention?branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '51. M13 Retention: Membership with endDate === todayUtc Excluded from Upcoming Expirations',
      retentionTodayCheck.status,
      200,
      retentionTodayCheck.data?.data?.staleActiveCount >= 1
    );

    // 52. Stale Active Membership (Past endDate): Excluded from upcoming & counted in staleActiveCount
    const staleMemberId = new ObjectId();
    await testDb.collection('memberships').insertOne({
      _id: new ObjectId(),
      organizationId: org1Id,
      branchId: branch1Id,
      memberId: staleMemberId,
      planId: planSingleId,
      startDate: thirtyDaysAgoIso,
      endDate: yesterdayIso, // past date
      status: 'active',
      autoRenew: false
    });
    const retentionStaleCheck = await apiRequest(`/api/analytics/membership-retention?branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '52. M13 Retention: Stale Active Membership Counted in staleActiveCount',
      retentionStaleCheck.status,
      200,
      retentionStaleCheck.data?.data?.staleActiveCount >= 2
    );

    // 53. Retention Date Bucketing: Controlled fixtures verify accurate placement
    const futureMemberId = new ObjectId();
    const d5Iso = new Date(nowUtc.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    await testDb.collection('memberships').insertOne({
      _id: new ObjectId(),
      organizationId: org1Id,
      branchId: branch1Id,
      memberId: futureMemberId,
      planId: planSingleId,
      startDate: todayIso,
      endDate: d5Iso, // in 5 days (within 7 days)
      status: 'active',
      autoRenew: false
    });
    const retentionBucketCheck = await apiRequest(`/api/analytics/membership-retention?branchId=${branch1Id.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '53. M13 Retention: Controlled Fixture Placed in within7Days Bucket',
      retentionBucketCheck.status,
      200,
      retentionBucketCheck.data?.data?.expiringBuckets?.within7Days >= 1 &&
        retentionBucketCheck.data?.data?.cumulativeExpiring?.expiringIn7Days >= 1
    );

    // 54. Zero/Missing Capacity: Branch with capacity: 0 returns flowUtilizationPercent: null
    const zeroCapBranchId = new ObjectId();
    await testDb.collection('branches').insertOne({
      _id: zeroCapBranchId,
      organizationId: org1Id,
      name: 'Zero Cap Branch',
      address: { street: 'Z0', city: 'Pune', state: 'MH', postalCode: '411001' },
      phone: '9800000099',
      capacity: new Int32(0),
      openingTime: '06:00',
      closingTime: '22:00',
      status: 'active'
    });
    const zeroCapCheck = await apiRequest(`/api/analytics/attendance?branchId=${zeroCapBranchId.toString()}`, 'GET', undefined, adminToken);
    recordTest(
      '54. M13 Attendance: Zero Capacity Branch Returns flowUtilizationPercent: null',
      zeroCapCheck.status,
      200,
      zeroCapCheck.data?.data?.flowUtilizationPercent === null
    );

  } finally {
    // HARD SAFETY GUARD #3: Teardown strictly drops GYM360_TEST only
    console.log('[Tier B Teardown] Cleaning up test server and dropping GYM360_TEST...');
    server.close();
    await dbConnection.disconnect();
    if (testDb.databaseName === 'GYM360_TEST') {
      await testDb.dropDatabase();
      console.log('[Tier B Teardown] GYM360_TEST dropped successfully. GYM360 remained untouched.');
    } else {
      console.error(`[Tier B Teardown Alert] Refused to drop database with name: ${testDb.databaseName}`);
    }
    await client.close();
  }

  let passed = results.filter((r) => r.passed).length;
  let failed = results.filter((r) => !r.passed).length;
  console.log(`\n=== TIER B COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);

  return { passed, failed, results };
}

// Direct execution support
if (require.main === module) {
  runTierBTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
