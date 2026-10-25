import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  AttendanceDocument,
  AttendanceMethod,
  AttendanceQuery,
  AttendanceStatus,
  CheckInDTO,
  CheckOutDTO,
  ManualAttendanceDTO
} from '../types/attendance';
import {
  getTodayUtcDateString,
  isMembershipValidUtc,
  isValidIsoTimestamp,
  isValidUtcDateString
} from '../utils/dateUtils';

const ALLOWED_STATUSES: AttendanceStatus[] = ['present', 'absent'];
const ALLOWED_METHODS: AttendanceMethod[] = ['manual', 'qr', 'biometric'];

export class AttendanceService {
  /**
   * Member check-in with strict branch access tier validation.
   */
  static async checkIn(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    dto: CheckInDTO
  ): Promise<AttendanceDocument> {
    const db = dbConnection.getDb();

    // 1. Role and identity resolution
    let targetMemberId: ObjectId;
    let method: AttendanceMethod;

    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked to user account', 403);
      }
      if (dto.memberId && dto.memberId !== callerMemberId) {
        throw new AppError('Forbidden: Members can only check in for themselves', 403);
      }
      targetMemberId = new ObjectId(callerMemberId);

      // Method enforcement for members: strictly 'qr'
      if (dto.method && dto.method !== 'qr') {
        throw new AppError(
          'Forbidden: Members can only self check-in using QR code. Manual and biometric methods are staff-only',
          403
        );
      }
      method = 'qr';
    } else {
      // Admin check-in
      if (!dto.memberId || !ObjectId.isValid(dto.memberId)) {
        throw new AppError('Valid memberId is required for check-in', 400);
      }
      targetMemberId = new ObjectId(dto.memberId);
      method = dto.method || 'manual';
    }

    if (!ALLOWED_METHODS.includes(method)) {
      throw new AppError(`Invalid check-in method. Allowed: ${ALLOWED_METHODS.join(', ')}`, 400);
    }

    // 2. Validate branchId
    if (!dto.branchId || !ObjectId.isValid(dto.branchId)) {
      throw new AppError('Valid branchId is required', 400);
    }
    const branchObjectId = new ObjectId(dto.branchId);

    // 3. Verify branch exists and strictly belongs to tenant
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId
    });
    if (!branch) {
      throw new AppError('Branch not found in this organization', 404);
    }

    // 4. Verify member exists and belongs to tenant
    const member = await db.collection('members').findOne({
      _id: targetMemberId,
      organizationId: tenantId
    });
    if (!member) {
      throw new AppError('Member not found in this organization', 404);
    }

    // 5. Active Membership Verification
    // Rule: status === 'active' AND startDate <= UTC today AND UTC today < endDate
    const todayUtc = getTodayUtcDateString();
    const candidateMemberships = await db
      .collection('memberships')
      .find({
        organizationId: tenantId,
        memberId: targetMemberId,
        status: 'active'
      })
      .toArray();

    const validMemberships = candidateMemberships.filter((m: any) =>
      isMembershipValidUtc(m.startDate, m.endDate, m.status, todayUtc)
    );

    if (validMemberships.length === 0) {
      throw new AppError(
        'Forbidden: No active and valid membership found for member',
        403
      );
    }

    // 6. Branch Access Tier Authorization
    // Multi-membership rule: authorized if ANY valid membership grants access to branchId
    const planIds = validMemberships.map((m: any) => m.planId);
    const plans = await db
      .collection('membershipPlans')
      .find({
        _id: { $in: planIds },
        organizationId: tenantId
      })
      .toArray();

    const planMap = new Map<string, any>(
      plans.map((p: any) => [p._id.toString(), p])
    );

    let isBranchAuthorized = false;
    for (const m of validMemberships) {
      const plan = planMap.get(m.planId.toString());
      if (!plan) continue;

      if (plan.branchAccess === 'all_branches') {
        // all_branches grants access to any branch belonging to this tenant
        isBranchAuthorized = true;
        break;
      } else if (
        plan.branchAccess === 'single_branch' &&
        m.branchId.toString() === branchObjectId.toString()
      ) {
        // single_branch grants access strictly to membership.branchId
        isBranchAuthorized = true;
        break;
      }
    }

    if (!isBranchAuthorized) {
      throw new AppError(
        'Forbidden: Membership plan does not grant access to this branch',
        403
      );
    }

    // 7. Validate supplied checkInTime or generate ISO-8601 UTC timestamp
    let checkInTime: string;
    if (dto.checkInTime !== undefined) {
      if (!isValidIsoTimestamp(dto.checkInTime)) {
        throw new AppError(
          'Invalid checkInTime format. Must be a valid ISO-8601 timestamp',
          400
        );
      }
      checkInTime = dto.checkInTime;
    } else {
      checkInTime = new Date().toISOString();
    }

    // 8. Prevent duplicate open check-in sessions
    const existingOpenSession = await db.collection('attendance').findOne({
      organizationId: tenantId,
      memberId: targetMemberId,
      status: 'present',
      checkOutTime: ''
    });

    if (existingOpenSession) {
      throw new AppError(
        'Member is already checked in and has an active open session. Please check out first',
        400
      );
    }

    // 9. Create attendance document adhering strictly to existing schema (no membershipId)
    const docToInsert: AttendanceDocument = {
      organizationId: tenantId,
      branchId: branchObjectId,
      memberId: targetMemberId,
      checkInTime,
      checkOutTime: '',
      status: 'present',
      method
    };

    const result = await db.collection('attendance').insertOne(docToInsert as any);
    docToInsert._id = result.insertedId;

    return docToInsert;
  }

  /**
   * Member check-out with chronological validation and tenant scoping.
   */
  static async checkOut(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    dto: CheckOutDTO
  ): Promise<AttendanceDocument> {
    const db = dbConnection.getDb();

    // 1. Identity resolution
    let targetMemberId: ObjectId;

    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked to user account', 403);
      }
      if (dto.memberId && dto.memberId !== callerMemberId) {
        throw new AppError('Forbidden: Members can only check out for themselves', 403);
      }
      targetMemberId = new ObjectId(callerMemberId);
    } else {
      if (!dto.memberId || !ObjectId.isValid(dto.memberId)) {
        throw new AppError('Valid memberId is required for check-out', 400);
      }
      targetMemberId = new ObjectId(dto.memberId);
    }

    // 2. Validate supplied checkOutTime or generate ISO-8601 UTC timestamp
    let checkOutTime: string;
    if (dto.checkOutTime !== undefined) {
      if (!isValidIsoTimestamp(dto.checkOutTime)) {
        throw new AppError(
          'Invalid checkOutTime format. Must be a valid ISO-8601 timestamp',
          400
        );
      }
      checkOutTime = dto.checkOutTime;
    } else {
      checkOutTime = new Date().toISOString();
    }

    // 3. Find open attendance session (strictly tenant-scoped)
    const openSession = await db.collection<AttendanceDocument>('attendance').findOne({
      organizationId: tenantId,
      memberId: targetMemberId,
      status: 'present',
      checkOutTime: ''
    });

    if (!openSession) {
      throw new AppError(
        'No active check-in session found for this member to check out',
        400
      );
    }

    // 4. Chronological validation: checkOutTime >= checkInTime
    const checkInMs = Date.parse(openSession.checkInTime);
    const checkOutMs = Date.parse(checkOutTime);

    if (checkOutMs < checkInMs) {
      throw new AppError(
        'checkOutTime cannot be earlier than checkInTime',
        400
      );
    }

    // 5. Update session record
    await db.collection('attendance').updateOne(
      { _id: openSession._id, organizationId: tenantId },
      { $set: { checkOutTime } }
    );

    return {
      ...openSession,
      checkOutTime
    };
  }

  /**
   * Manual attendance recording by admin (present or absent).
   */
  static async createManual(
    tenantId: ObjectId,
    callerRole: string,
    dto: ManualAttendanceDTO
  ): Promise<AttendanceDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can log manual attendance records', 403);
    }

    const db = dbConnection.getDb();

    // 1. Validate IDs
    if (!dto.memberId || !ObjectId.isValid(dto.memberId)) {
      throw new AppError('Valid memberId is required', 400);
    }
    if (!dto.branchId || !ObjectId.isValid(dto.branchId)) {
      throw new AppError('Valid branchId is required', 400);
    }

    const memberObjectId = new ObjectId(dto.memberId);
    const branchObjectId = new ObjectId(dto.branchId);

    // 2. Validate member & branch existence in tenant
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId
    });
    if (!branch) {
      throw new AppError('Branch not found in this organization', 404);
    }

    const member = await db.collection('members').findOne({
      _id: memberObjectId,
      organizationId: tenantId
    });
    if (!member) {
      throw new AppError('Member not found in this organization', 404);
    }

    // 3. Status and method validation
    if (!ALLOWED_STATUSES.includes(dto.status)) {
      throw new AppError(`Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400);
    }
    if (!ALLOWED_METHODS.includes(dto.method)) {
      throw new AppError(`Invalid method. Allowed: ${ALLOWED_METHODS.join(', ')}`, 400);
    }

    let checkInTime = '';
    let checkOutTime = '';

    if (dto.status === 'absent') {
      // Unambiguous absent records: must use empty timestamp strings
      if (
        (dto.checkInTime !== undefined && dto.checkInTime !== '') ||
        (dto.checkOutTime !== undefined && dto.checkOutTime !== '')
      ) {
        throw new AppError(
          'Absent attendance records must not have check-in or check-out timestamps',
          400
        );
      }
      checkInTime = '';
      checkOutTime = '';
    } else {
      // status === 'present'
      // Conflict check: member must not have an active open check-in session
      const openSession = await db.collection('attendance').findOne({
        organizationId: tenantId,
        memberId: memberObjectId,
        status: 'present',
        checkOutTime: ''
      });

      if (openSession) {
        throw new AppError(
          'Cannot log manual attendance while member has an active open check-in session',
          409
        );
      }

      if (!dto.checkInTime || !dto.checkOutTime) {
        throw new AppError(
          'checkInTime and checkOutTime are required for present attendance records',
          400
        );
      }

      if (!isValidIsoTimestamp(dto.checkInTime)) {
        throw new AppError(
          'Invalid checkInTime format. Must be a valid ISO-8601 timestamp',
          400
        );
      }
      if (!isValidIsoTimestamp(dto.checkOutTime)) {
        throw new AppError(
          'Invalid checkOutTime format. Must be a valid ISO-8601 timestamp',
          400
        );
      }

      // Chronological check
      const inMs = Date.parse(dto.checkInTime);
      const outMs = Date.parse(dto.checkOutTime);
      if (outMs < inMs) {
        throw new AppError(
          'checkOutTime cannot be earlier than checkInTime',
          400
        );
      }

      checkInTime = dto.checkInTime;
      checkOutTime = dto.checkOutTime;
    }

    const docToInsert: AttendanceDocument = {
      organizationId: tenantId,
      branchId: branchObjectId,
      memberId: memberObjectId,
      checkInTime,
      checkOutTime,
      status: dto.status,
      method: dto.method
    };

    const result = await db.collection('attendance').insertOne(docToInsert as any);
    docToInsert._id = result.insertedId;

    return docToInsert;
  }

  /**
   * List attendance records with tenant and UTC date filtering.
   */
  static async getAttendance(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    query: AttendanceQuery
  ): Promise<{ count: number; data: AttendanceDocument[] }> {
    const db = dbConnection.getDb();
    const filter: any = (callerRole === 'admin' || !tenantId) ? {} : { organizationId: tenantId };

    // Role-based scoping
    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked', 403);
      }
      if (query.memberId && query.memberId !== callerMemberId) {
        throw new AppError('Forbidden: Members can only view their own attendance', 403);
      }
      filter.memberId = new ObjectId(callerMemberId);
    } else {
      if (query.memberId) {
        if (!ObjectId.isValid(query.memberId)) {
          throw new AppError('Invalid memberId query parameter', 400);
        }
        filter.memberId = new ObjectId(query.memberId);
      }
    }

    if (query.branchId) {
      if (!ObjectId.isValid(query.branchId)) {
        throw new AppError('Invalid branchId query parameter', 400);
      }
      filter.branchId = new ObjectId(query.branchId);
    }

    if (query.status) {
      if (!ALLOWED_STATUSES.includes(query.status)) {
        throw new AppError(`Invalid status filter. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400);
      }
      filter.status = query.status;
    }

    // UTC calendar date filtering
    if (query.date) {
      if (!isValidUtcDateString(query.date)) {
        throw new AppError('Invalid date format. Expected YYYY-MM-DD.', 400);
      }
      filter.checkInTime = { $regex: `^${query.date}` };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const count = await db.collection('attendance').countDocuments(filter);
    const data = await db
      .collection<AttendanceDocument>('attendance')
      .find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { count, data };
  }

  /**
   * Retrieve a single attendance document by ID.
   */
  static async getAttendanceById(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    attendanceId: string
  ): Promise<AttendanceDocument> {
    if (!ObjectId.isValid(attendanceId)) {
      throw new AppError('Invalid attendanceId', 400);
    }

    const db = dbConnection.getDb();
    const record = await db.collection<AttendanceDocument>('attendance').findOne({
      _id: new ObjectId(attendanceId),
      organizationId: tenantId
    });

    if (!record) {
      throw new AppError('Attendance record not found', 404);
    }

    if (callerRole === 'member') {
      if (!callerMemberId || record.memberId.toString() !== callerMemberId) {
        throw new AppError('Forbidden: You can only view your own attendance records', 403);
      }
    }

    return record;
  }

  static async deleteAttendance(
    tenantId: ObjectId | undefined,
    attendanceId: string
  ): Promise<boolean> {
    if (!ObjectId.isValid(attendanceId)) {
      throw new AppError('Invalid attendanceId', 400);
    }
    const db = dbConnection.getDb();
    const query: any = { _id: new ObjectId(attendanceId) };
    if (tenantId) {
      query.organizationId = tenantId;
    }
    const result = await db.collection('attendance').deleteOne(query);
    if (result.deletedCount === 0) {
      throw new AppError('Attendance record not found or already deleted.', 404);
    }
    return true;
  }
}
