import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  MemberWorkoutPlanDocument,
  MemberWorkoutPlanStatus,
  CreateMemberWorkoutPlanDTO,
  MemberWorkoutPlanQuery
} from '../types/memberWorkoutPlan';
import { WorkoutPlanDocument } from '../types/workoutPlan';
import {
  calculateEndDateUtc,
  isValidUtcDateString
} from '../utils/dateUtils';

export class MemberWorkoutPlanService {
  /**
   * Admin assigns a workout plan to a member.
   */
  static async assignPlan(
    tenantId: ObjectId,
    callerRole: string,
    adminUserId: string,
    dto: CreateMemberWorkoutPlanDTO
  ): Promise<MemberWorkoutPlanDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can assign workout plans', 403);
    }
    if (!ObjectId.isValid(adminUserId)) {
      throw new AppError('Invalid admin userId', 400);
    }

    // 1. Validate memberId
    if (!dto.memberId || !ObjectId.isValid(dto.memberId)) {
      throw new AppError('Valid memberId is required', 400);
    }
    const memberObjectId = new ObjectId(dto.memberId);

    // 2. Validate workoutPlanId
    if (!dto.workoutPlanId || !ObjectId.isValid(dto.workoutPlanId)) {
      throw new AppError('Valid workoutPlanId is required', 400);
    }
    const planObjectId = new ObjectId(dto.workoutPlanId);

    // 3. Validate strict startDate (YYYY-MM-DD)
    if (!isValidUtcDateString(dto.startDate)) {
      throw new AppError(
        'Invalid startDate format. Expected strictly YYYY-MM-DD with a valid calendar date',
        400
      );
    }

    const db = dbConnection.getDb();

    // 4. Verify member exists in tenant and is ACTIVE
    const member = await db.collection('members').findOne({
      _id: memberObjectId,
      organizationId: tenantId
    });
    if (!member) {
      throw new AppError('Member not found in your organization', 404);
    }
    if (member.status !== 'active') {
      throw new AppError('Member profile is inactive', 400);
    }

    // 5. Verify workout plan exists in tenant and is ACTIVE
    const plan = await db.collection<WorkoutPlanDocument>('workoutPlans').findOne({
      _id: planObjectId,
      organizationId: tenantId
    });
    if (!plan) {
      throw new AppError('Workout plan not found in your organization', 404);
    }
    if (plan.status !== 'active') {
      throw new AppError('Cannot assign an inactive workout plan', 400);
    }

    // 6. Single Active Assignment Rule
    const existingActive = await db.collection('memberWorkoutPlans').findOne({
      organizationId: tenantId,
      memberId: memberObjectId,
      status: 'active'
    });
    if (existingActive) {
      throw new AppError(
        'Member already has an active workout plan assignment. Complete or deactivate the existing assignment before creating a new one.',
        409
      );
    }

    // 7. Calculate endDate strictly on the server: startDate + (durationWeeks * 7 days)
    const durationDays = Number(plan.durationWeeks) * 7;
    const endDate = calculateEndDateUtc(dto.startDate, durationDays);

    // 8. Full-Period Membership Coverage Validation
    const candidateMemberships = await db
      .collection('memberships')
      .find({
        organizationId: tenantId,
        memberId: memberObjectId,
        status: 'active'
      })
      .toArray();

    // Must cover the ENTIRE period: membership.startDate <= assignment.startDate AND assignment.endDate <= membership.endDate
    const coveringMemberships = candidateMemberships.filter(
      (m: any) => m.startDate <= dto.startDate && endDate <= m.endDate
    );

    if (coveringMemberships.length === 0) {
      throw new AppError(
        'Forbidden: Member must have an active membership covering the entire workout assignment period',
        403
      );
    }

    // Validate branch access tier for covering memberships
    const planIds = coveringMemberships.map((m: any) => m.planId);
    const membershipPlans = await db
      .collection('membershipPlans')
      .find({
        _id: { $in: planIds },
        organizationId: tenantId
      })
      .toArray();

    const planMap = new Map<string, any>(membershipPlans.map((p: any) => [p._id.toString(), p]));

    let isBranchCovered = false;
    for (const m of coveringMemberships) {
      const mp = planMap.get(m.planId.toString());
      if (!mp) continue;

      if (mp.branchAccess === 'all_branches') {
        isBranchCovered = true;
        break;
      } else if (
        mp.branchAccess === 'single_branch' &&
        m.branchId.toString() === member.branchId.toString()
      ) {
        isBranchCovered = true;
        break;
      }
    }

    if (!isBranchCovered) {
      throw new AppError(
        'Forbidden: Member membership does not grant access to the assigned branch',
        403
      );
    }

    // 9. Construct document with derived branchId and assignedBy
    const newAssignment: MemberWorkoutPlanDocument = {
      organizationId: tenantId,
      branchId: member.branchId, // Derived from member's assigned home branch
      memberId: memberObjectId,
      workoutPlanId: planObjectId,
      assignedBy: new ObjectId(adminUserId), // Authenticated admin userId
      startDate: dto.startDate,
      endDate,
      status: 'active',
      notes: dto.notes ? dto.notes.trim() : ''
    };

    const result = await db.collection('memberWorkoutPlans').insertOne(newAssignment as any);
    newAssignment._id = result.insertedId;

    return newAssignment;
  }

  /**
   * Update assignment status adhering to strict state machine rules.
   */
  static async updateAssignmentStatus(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    assignmentId: string,
    newStatus: MemberWorkoutPlanStatus
  ): Promise<MemberWorkoutPlanDocument> {
    if (!ObjectId.isValid(assignmentId)) {
      throw new AppError('Invalid assignmentId', 400);
    }

    if (!['completed', 'inactive'].includes(newStatus)) {
      throw new AppError('Invalid status update. Allowed target states: completed, inactive', 400);
    }

    const db = dbConnection.getDb();
    const assignmentObjectId = new ObjectId(assignmentId);

    const assignment = await db
      .collection<MemberWorkoutPlanDocument>('memberWorkoutPlans')
      .findOne({
        _id: assignmentObjectId,
        organizationId: tenantId
      });

    if (!assignment) {
      throw new AppError('Member workout plan assignment not found', 404);
    }

    // Member role permissions
    if (callerRole === 'member') {
      if (!callerMemberId || assignment.memberId.toString() !== callerMemberId) {
        throw new AppError(
          'Forbidden: You can only update your own workout plan assignments',
          403
        );
      }
      if (newStatus !== 'completed') {
        throw new AppError(
          'Forbidden: Members can only mark active assignments as completed',
          403
        );
      }
    }

    // Terminal state protection: completed and inactive are terminal
    if (assignment.status === 'completed' || assignment.status === 'inactive') {
      throw new AppError(
        `Cannot modify status of an assignment that is already ${assignment.status}`,
        400
      );
    }

    await db.collection('memberWorkoutPlans').updateOne(
      { _id: assignmentObjectId, organizationId: tenantId },
      { $set: { status: newStatus } }
    );

    return {
      ...assignment,
      status: newStatus
    };
  }

  /**
   * List member workout plan assignments with role scoping.
   */
  static async listAssignments(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    query: MemberWorkoutPlanQuery
  ): Promise<{ count: number; data: MemberWorkoutPlanDocument[] }> {
    const db = dbConnection.getDb();
    const filter: any = { organizationId: tenantId };

    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked', 403);
      }
      if (query.memberId && query.memberId !== callerMemberId) {
        throw new AppError(
          'Forbidden: Members can only view their own workout assignments',
          403
        );
      }
      filter.memberId = new ObjectId(callerMemberId);
    } else {
      if (query.memberId && ObjectId.isValid(query.memberId)) {
        filter.memberId = new ObjectId(query.memberId);
      }
    }

    if (query.branchId && ObjectId.isValid(query.branchId)) {
      filter.branchId = new ObjectId(query.branchId);
    }
    if (query.status && ['active', 'inactive', 'completed'].includes(query.status)) {
      filter.status = query.status;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const count = await db.collection('memberWorkoutPlans').countDocuments(filter);
    const data = await db
      .collection<MemberWorkoutPlanDocument>('memberWorkoutPlans')
      .find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { count, data };
  }

  /**
   * Retrieve single assignment by ID.
   */
  static async getAssignmentById(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    assignmentId: string
  ): Promise<MemberWorkoutPlanDocument> {
    if (!ObjectId.isValid(assignmentId)) {
      throw new AppError('Invalid assignmentId', 400);
    }

    const db = dbConnection.getDb();
    const assignment = await db
      .collection<MemberWorkoutPlanDocument>('memberWorkoutPlans')
      .findOne({
        _id: new ObjectId(assignmentId),
        organizationId: tenantId
      });

    if (!assignment) {
      throw new AppError('Member workout plan assignment not found', 404);
    }

    if (callerRole === 'member') {
      if (!callerMemberId || assignment.memberId.toString() !== callerMemberId) {
        throw new AppError(
          'Forbidden: You can only view your own workout assignments',
          403
        );
      }
    }

    return assignment;
  }
}
