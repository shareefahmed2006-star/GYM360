import { ObjectId, Int32 } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  WorkoutPlanDocument,
  WorkoutPlanStatus,
  CreateWorkoutPlanDTO,
  UpdateWorkoutPlanDTO,
  WorkoutPlanQuery
} from '../types/workoutPlan';

export const validateDurationWeeks = (weeks: unknown): Int32 => {
  if (typeof weeks !== 'number' || !Number.isFinite(weeks)) {
    throw new AppError('durationWeeks must be a valid finite number', 400);
  }
  if (!Number.isInteger(weeks)) {
    throw new AppError('durationWeeks must be an integer (floating-point values not allowed)', 400);
  }
  if (weeks <= 0) {
    throw new AppError('durationWeeks must be strictly greater than zero', 400);
  }
  if (weeks > 2147483647) {
    throw new AppError('durationWeeks exceeds 32-bit integer range', 400);
  }
  return new Int32(weeks);
};

export class WorkoutPlanService {
  /**
   * Admin creates a workout plan template.
   */
  static async createPlan(
    tenantId: ObjectId,
    callerRole: string,
    adminUserId: string,
    dto: CreateWorkoutPlanDTO
  ): Promise<WorkoutPlanDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can create workout plans', 403);
    }
    if (!ObjectId.isValid(adminUserId)) {
      throw new AppError('Invalid admin userId', 400);
    }

    if (!dto.name || typeof dto.name !== 'string' || !dto.name.trim()) {
      throw new AppError('Plan name is required', 400);
    }
    if (!dto.description || typeof dto.description !== 'string' || !dto.description.trim()) {
      throw new AppError('Plan description is required', 400);
    }
    if (!dto.goal || typeof dto.goal !== 'string' || !dto.goal.trim()) {
      throw new AppError('Plan goal is required', 400);
    }
    if (!dto.difficulty || typeof dto.difficulty !== 'string' || !dto.difficulty.trim()) {
      throw new AppError('Plan difficulty is required', 400);
    }

    const durationWeeksInt32 = validateDurationWeeks(dto.durationWeeks);

    const db = dbConnection.getDb();
    const newPlan: WorkoutPlanDocument = {
      organizationId: tenantId,
      name: dto.name.trim(),
      description: dto.description.trim(),
      goal: dto.goal.trim(),
      difficulty: dto.difficulty.trim(),
      durationWeeks: durationWeeksInt32,
      createdBy: new ObjectId(adminUserId),
      status: 'active'
    };

    const result = await db.collection('workoutPlans').insertOne(newPlan as any);
    newPlan._id = result.insertedId;

    return newPlan;
  }

  /**
   * Admin updates workout plan fields with historical immutability enforcement.
   */
  static async updatePlan(
    tenantId: ObjectId,
    callerRole: string,
    planId: string,
    dto: UpdateWorkoutPlanDTO & Record<string, any>
  ): Promise<WorkoutPlanDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can update workout plans', 403);
    }
    if (!ObjectId.isValid(planId)) {
      throw new AppError('Invalid planId', 400);
    }

    // 1. Immutable identifiers
    if (dto._id !== undefined || dto.organizationId !== undefined || dto.createdBy !== undefined) {
      throw new AppError('Forbidden: _id, organizationId, and createdBy are immutable', 400);
    }

    const db = dbConnection.getDb();
    const planObjectId = new ObjectId(planId);

    const currentPlan = await db.collection<WorkoutPlanDocument>('workoutPlans').findOne({
      _id: planObjectId,
      organizationId: tenantId
    });
    if (!currentPlan) {
      throw new AppError('Workout plan not found in your organization', 404);
    }

    // 2. Check if this plan has EVER been referenced by ANY memberWorkoutPlans document
    const assignmentRefCount = await db.collection('memberWorkoutPlans').countDocuments({
      workoutPlanId: planObjectId,
      organizationId: tenantId
    });

    const isAssigned = assignmentRefCount > 0;

    // Check immutability of terms if ever assigned
    if (isAssigned) {
      const changesDuration =
        dto.durationWeeks !== undefined &&
        Number(dto.durationWeeks) !== Number(currentPlan.durationWeeks);
      const changesGoal =
        dto.goal !== undefined && dto.goal.trim() !== currentPlan.goal;
      const changesDifficulty =
        dto.difficulty !== undefined && dto.difficulty.trim() !== currentPlan.difficulty;

      if (changesDuration || changesGoal || changesDifficulty) {
        throw new AppError(
          'Workout plan terms (durationWeeks, goal, difficulty) cannot be modified because this plan has already been assigned to members. To change these terms, please create a new workout plan.',
          409
        );
      }
    }

    const updateFields: any = {};

    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string' || !dto.name.trim()) {
        throw new AppError('Plan name cannot be empty', 400);
      }
      updateFields.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      if (typeof dto.description !== 'string' || !dto.description.trim()) {
        throw new AppError('Plan description cannot be empty', 400);
      }
      updateFields.description = dto.description.trim();
    }

    // Terms editable only before first assignment
    if (!isAssigned) {
      if (dto.goal !== undefined) {
        if (typeof dto.goal !== 'string' || !dto.goal.trim()) {
          throw new AppError('Plan goal cannot be empty', 400);
        }
        updateFields.goal = dto.goal.trim();
      }
      if (dto.difficulty !== undefined) {
        if (typeof dto.difficulty !== 'string' || !dto.difficulty.trim()) {
          throw new AppError('Plan difficulty cannot be empty', 400);
        }
        updateFields.difficulty = dto.difficulty.trim();
      }
      if (dto.durationWeeks !== undefined) {
        updateFields.durationWeeks = validateDurationWeeks(dto.durationWeeks);
      }
    }

    if (dto.status !== undefined) {
      if (!['active', 'inactive'].includes(dto.status)) {
        throw new AppError('Invalid status. Allowed: active, inactive', 400);
      }
      updateFields.status = dto.status;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new AppError('No valid fields provided for update', 400);
    }

    await db.collection('workoutPlans').updateOne(
      { _id: planObjectId, organizationId: tenantId },
      { $set: updateFields }
    );

    const updated = await db.collection<WorkoutPlanDocument>('workoutPlans').findOne({
      _id: planObjectId,
      organizationId: tenantId
    });

    return updated!;
  }

  /**
   * List workout plans with tenant scoping and role-based visibility.
   */
  static async listPlans(
    tenantId: ObjectId,
    callerRole: string,
    query: WorkoutPlanQuery
  ): Promise<WorkoutPlanDocument[]> {
    const db = dbConnection.getDb();
    const filter: any = (callerRole === 'admin' || !tenantId) ? {} : { organizationId: tenantId };

    if (callerRole === 'member') {
      // Members are strictly restricted to ACTIVE plans only
      filter.status = 'active';
    } else {
      // Admin filter
      if (query.status && ['active', 'inactive'].includes(query.status)) {
        filter.status = query.status;
      }
    }

    if (query.goal) {
      filter.goal = query.goal;
    }
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    return db.collection<WorkoutPlanDocument>('workoutPlans').find(filter).toArray();
  }

  /**
   * Retrieve single workout plan by ID.
   */
  static async getPlanById(
    tenantId: ObjectId,
    callerRole: string,
    planId: string
  ): Promise<WorkoutPlanDocument> {
    if (!ObjectId.isValid(planId)) {
      throw new AppError('Invalid planId', 400);
    }

    const db = dbConnection.getDb();
    const plan = await db.collection<WorkoutPlanDocument>('workoutPlans').findOne({
      _id: new ObjectId(planId),
      organizationId: tenantId
    });

    if (!plan) {
      throw new AppError('Workout plan not found', 404);
    }

    if (callerRole === 'member' && plan.status !== 'active') {
      throw new AppError('Workout plan not found', 404);
    }

    return plan;
  }
}
