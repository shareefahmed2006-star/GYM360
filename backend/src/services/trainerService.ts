import { ObjectId, Int32 } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  TrainerDocument,
  TrainerStatus,
  CreateTrainerDTO,
  UpdateTrainerDTO,
  TrainerAvailabilityDocument,
  CreateAvailabilityDTO,
  AvailabilityStatus,
  TrainerSessionDocument,
  BookSessionDTO,
  SessionStatus,
  DayOfWeek,
  TrainerQuery,
  SessionQuery
} from '../types/trainer';
import {
  getTodayUtcDateString,
  isMembershipValidUtc,
  isValidTimeString,
  isValidUtcDateString,
  getDayOfWeekFromUtcDate
} from '../utils/dateUtils';

const VALID_DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export class TrainerService {
  /**
   * Admin creates a trainer profile.
   */
  static async createTrainer(
    tenantId: ObjectId,
    callerRole: string,
    dto: CreateTrainerDTO
  ): Promise<TrainerDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can create trainer profiles', 403);
    }

    const db = dbConnection.getDb();

    // 1. Required field checks
    if (!dto.firstName || !dto.lastName || !dto.email || !dto.phone || !dto.bio) {
      throw new AppError('firstName, lastName, email, phone, and bio are required', 400);
    }
    if (!Array.isArray(dto.specialization) || dto.specialization.length === 0) {
      throw new AppError('specialization must be a non-empty array of strings', 400);
    }

    // 2. experienceYears validation as non-negative finite integer -> BSON Int32
    if (
      typeof dto.experienceYears !== 'number' ||
      !Number.isInteger(dto.experienceYears) ||
      dto.experienceYears < 0
    ) {
      throw new AppError('experienceYears must be a non-negative integer', 400);
    }

    // 3. branchId validation & active check in tenant
    if (!dto.branchId || !ObjectId.isValid(dto.branchId)) {
      throw new AppError('Valid branchId is required', 400);
    }
    const branchObjectId = new ObjectId(dto.branchId);
    const branch = await db.collection('branches').findOne({
      _id: branchObjectId,
      organizationId: tenantId,
      status: 'active'
    });
    if (!branch) {
      throw new AppError('Target branch not found or is inactive in your organization', 400);
    }

    // 4. Application-level email deduplication within tenant
    const existingTrainer = await db.collection('trainers').findOne({
      organizationId: tenantId,
      email: dto.email.trim().toLowerCase()
    });
    if (existingTrainer) {
      throw new AppError('Trainer with this email already exists in this organization', 409);
    }

    const newTrainer: TrainerDocument = {
      organizationId: tenantId,
      branchId: branchObjectId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      specialization: dto.specialization.map((s) => s.trim()),
      experienceYears: new Int32(dto.experienceYears),
      bio: dto.bio.trim(),
      status: 'active'
    };

    const result = await db.collection('trainers').insertOne(newTrainer as any);
    newTrainer._id = result.insertedId;

    return newTrainer;
  }

  /**
   * Admin updates allowed trainer fields.
   */
  static async updateTrainer(
    tenantId: ObjectId,
    callerRole: string,
    trainerId: string,
    dto: UpdateTrainerDTO & Record<string, any>
  ): Promise<TrainerDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can update trainer profiles', 403);
    }
    if (!ObjectId.isValid(trainerId)) {
      throw new AppError('Invalid trainerId', 400);
    }

    const db = dbConnection.getDb();
    const trainerObjectId = new ObjectId(trainerId);

    // 1. Immutable field checks
    if (dto.email !== undefined || dto.organizationId !== undefined || dto._id !== undefined) {
      throw new AppError('Forbidden: email, organizationId, and _id are immutable', 400);
    }

    const trainer = await db.collection<TrainerDocument>('trainers').findOne({
      _id: trainerObjectId,
      organizationId: tenantId
    });
    if (!trainer) {
      throw new AppError('Trainer not found in your organization', 404);
    }

    const updateFields: any = {};

    if (dto.firstName !== undefined) updateFields.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) updateFields.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) updateFields.phone = dto.phone.trim();
    if (dto.bio !== undefined) updateFields.bio = dto.bio.trim();

    if (dto.specialization !== undefined) {
      if (!Array.isArray(dto.specialization) || dto.specialization.length === 0) {
        throw new AppError('specialization must be a non-empty array of strings', 400);
      }
      updateFields.specialization = dto.specialization.map((s) => s.trim());
    }

    if (dto.experienceYears !== undefined) {
      if (
        typeof dto.experienceYears !== 'number' ||
        !Number.isInteger(dto.experienceYears) ||
        dto.experienceYears < 0
      ) {
        throw new AppError('experienceYears must be a non-negative integer', 400);
      }
      updateFields.experienceYears = new Int32(dto.experienceYears);
    }

    if (dto.status !== undefined) {
      if (!['active', 'inactive'].includes(dto.status)) {
        throw new AppError('Invalid status. Allowed: active, inactive', 400);
      }
      updateFields.status = dto.status;
    }

    if (dto.branchId !== undefined) {
      if (!ObjectId.isValid(dto.branchId)) {
        throw new AppError('Invalid branchId', 400);
      }
      const branchObjectId = new ObjectId(dto.branchId);
      const branch = await db.collection('branches').findOne({
        _id: branchObjectId,
        organizationId: tenantId,
        status: 'active'
      });
      if (!branch) {
        throw new AppError('Target branch not found or is inactive', 400);
      }
      updateFields.branchId = branchObjectId;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new AppError('No valid fields provided for update', 400);
    }

    await db.collection('trainers').updateOne(
      { _id: trainerObjectId, organizationId: tenantId },
      { $set: updateFields }
    );

    const updated = await db.collection<TrainerDocument>('trainers').findOne({
      _id: trainerObjectId,
      organizationId: tenantId
    });

    return updated!;
  }

  /**
   * List trainers with optional filters.
   */
  static async listTrainers(
    tenantId: ObjectId | undefined,
    query: TrainerQuery
  ): Promise<TrainerDocument[]> {
    const db = dbConnection.getDb();
    const filter: any = tenantId ? { organizationId: tenantId } : {};

    if (query.branchId && ObjectId.isValid(query.branchId)) {
      filter.branchId = new ObjectId(query.branchId);
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.specialization) {
      filter.specialization = query.specialization;
    }

    return db.collection<TrainerDocument>('trainers').find(filter).toArray();
  }

  /**
   * Retrieve single trainer by ID.
   */
  static async getTrainerById(
    tenantId: ObjectId,
    trainerId: string
  ): Promise<TrainerDocument> {
    if (!ObjectId.isValid(trainerId)) {
      throw new AppError('Invalid trainerId', 400);
    }
    const db = dbConnection.getDb();
    const trainer = await db.collection<TrainerDocument>('trainers').findOne({
      _id: new ObjectId(trainerId),
      organizationId: tenantId
    });
    if (!trainer) {
      throw new AppError('Trainer not found', 404);
    }
    return trainer;
  }

  /**
   * Admin adds an availability slot for a trainer.
   * Slot branch is strictly derived from trainer.branchId.
   */
  static async createAvailability(
    tenantId: ObjectId,
    callerRole: string,
    trainerId: string,
    dto: CreateAvailabilityDTO
  ): Promise<TrainerAvailabilityDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can manage trainer availability', 403);
    }
    if (!ObjectId.isValid(trainerId)) {
      throw new AppError('Invalid trainerId', 400);
    }

    const db = dbConnection.getDb();
    const trainerObjectId = new ObjectId(trainerId);

    const trainer = await db.collection<TrainerDocument>('trainers').findOne({
      _id: trainerObjectId,
      organizationId: tenantId
    });
    if (!trainer) {
      throw new AppError('Trainer not found', 404);
    }

    // Day of week check
    if (!VALID_DAYS_OF_WEEK.includes(dto.dayOfWeek)) {
      throw new AppError(`Invalid dayOfWeek. Allowed: ${VALID_DAYS_OF_WEEK.join(', ')}`, 400);
    }

    // Time format checks
    if (!isValidTimeString(dto.startTime) || !isValidTimeString(dto.endTime)) {
      throw new AppError('Invalid time format. Expected 24-hour HH:mm', 400);
    }
    if (dto.startTime >= dto.endTime) {
      throw new AppError('endTime must be strictly later than startTime', 400);
    }

    const slotStatus: AvailabilityStatus = dto.status || 'available';
    if (!['available', 'unavailable'].includes(slotStatus)) {
      throw new AppError('Invalid status. Allowed: available, unavailable', 400);
    }

    // Overlap check for available slots
    if (slotStatus === 'available') {
      const existingSlots = await db
        .collection<TrainerAvailabilityDocument>('trainerAvailability')
        .find({
          organizationId: tenantId,
          trainerId: trainerObjectId,
          dayOfWeek: dto.dayOfWeek,
          status: 'available'
        })
        .toArray();

      for (const slot of existingSlots) {
        if (slot.startTime < dto.endTime && slot.endTime > dto.startTime) {
          throw new AppError(
            'Trainer already has an available schedule slot overlapping this time window',
            409
          );
        }
      }
    }

    const newSlot: TrainerAvailabilityDocument = {
      organizationId: tenantId,
      branchId: trainer.branchId, // Strictly derived from trainer
      trainerId: trainerObjectId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: slotStatus
    };

    const result = await db.collection('trainerAvailability').insertOne(newSlot as any);
    newSlot._id = result.insertedId;

    return newSlot;
  }

  /**
   * List weekly availability slots for a trainer.
   */
  static async listAvailability(
    tenantId: ObjectId,
    trainerId: string
  ): Promise<TrainerAvailabilityDocument[]> {
    if (!ObjectId.isValid(trainerId)) {
      throw new AppError('Invalid trainerId', 400);
    }
    const db = dbConnection.getDb();
    return db
      .collection<TrainerAvailabilityDocument>('trainerAvailability')
      .find({
        organizationId: tenantId,
        trainerId: new ObjectId(trainerId)
      })
      .toArray();
  }

  /**
   * Admin updates an availability slot status (available <-> unavailable).
   * Non-destructive: documents are never deleted.
   */
  static async updateAvailabilityStatus(
    tenantId: ObjectId,
    callerRole: string,
    trainerId: string,
    slotId: string,
    newStatus: AvailabilityStatus
  ): Promise<TrainerAvailabilityDocument> {
    if (callerRole !== 'admin') {
      throw new AppError('Forbidden: Only administrators can update availability status', 403);
    }
    if (!ObjectId.isValid(trainerId) || !ObjectId.isValid(slotId)) {
      throw new AppError('Invalid trainerId or slotId format', 400);
    }
    if (!['available', 'unavailable'].includes(newStatus)) {
      throw new AppError('Invalid status. Allowed: available, unavailable', 400);
    }

    const db = dbConnection.getDb();
    const trainerObjectId = new ObjectId(trainerId);
    const slotObjectId = new ObjectId(slotId);

    const slot = await db
      .collection<TrainerAvailabilityDocument>('trainerAvailability')
      .findOne({
        _id: slotObjectId,
        trainerId: trainerObjectId,
        organizationId: tenantId
      });
    if (!slot) {
      throw new AppError('Availability slot not found', 404);
    }

    // If activating to available, ensure no overlapping available slots exist
    if (newStatus === 'available') {
      const otherSlots = await db
        .collection<TrainerAvailabilityDocument>('trainerAvailability')
        .find({
          _id: { $ne: slotObjectId },
          organizationId: tenantId,
          trainerId: trainerObjectId,
          dayOfWeek: slot.dayOfWeek,
          status: 'available'
        })
        .toArray();

      for (const s of otherSlots) {
        if (s.startTime < slot.endTime && s.endTime > slot.startTime) {
          throw new AppError(
            'Cannot activate slot: overlaps another active available slot',
            409
          );
        }
      }
    }

    await db.collection('trainerAvailability').updateOne(
      { _id: slotObjectId },
      { $set: { status: newStatus } }
    );

    return {
      ...slot,
      status: newStatus
    };
  }

  /**
   * Book a training session with 4-way consistency, availability matching, and double-booking checks.
   */
  static async bookSession(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    dto: BookSessionDTO
  ): Promise<TrainerSessionDocument> {
    const db = dbConnection.getDb();

    // 1. Identity & member role enforcement
    let targetMemberId: ObjectId;
    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked to user account', 403);
      }
      if (dto.memberId && dto.memberId !== callerMemberId) {
        throw new AppError('Forbidden: Members can only book sessions for themselves', 403);
      }
      targetMemberId = new ObjectId(callerMemberId);
    } else {
      if (!dto.memberId || !ObjectId.isValid(dto.memberId)) {
        throw new AppError('Valid memberId is required for booking', 400);
      }
      targetMemberId = new ObjectId(dto.memberId);
    }

    // 2. Strict Date & Time format validations (no silent normalization)
    if (!isValidUtcDateString(dto.sessionDate)) {
      throw new AppError('Invalid sessionDate format. Expected YYYY-MM-DD.', 400);
    }
    if (dto.sessionDate < getTodayUtcDateString()) {
      throw new AppError('Cannot book sessions on a past date', 400);
    }

    if (!isValidTimeString(dto.startTime) || !isValidTimeString(dto.endTime)) {
      throw new AppError('Invalid time format. Expected 24-hour HH:mm', 400);
    }
    if (dto.startTime >= dto.endTime) {
      throw new AppError('endTime must be strictly later than startTime', 400);
    }

    if (!dto.sessionType || !dto.sessionType.trim()) {
      throw new AppError('sessionType is required', 400);
    }

    // 3. 4-Way Independent Consistency Checks

    // Check 1: Trainer must exist and be ACTIVE
    if (!dto.trainerId || !ObjectId.isValid(dto.trainerId)) {
      throw new AppError('Valid trainerId is required', 400);
    }
    const trainerObjectId = new ObjectId(dto.trainerId);
    const trainer = await db.collection<TrainerDocument>('trainers').findOne({
      _id: trainerObjectId,
      organizationId: tenantId
    });
    if (!trainer) {
      throw new AppError('Trainer not found in your organization', 404);
    }
    if (trainer.status !== 'active') {
      throw new AppError('Trainer is inactive and cannot accept session bookings', 400);
    }

    // Check 2: Trainer's assigned branch must exist and be ACTIVE
    const branch = await db.collection('branches').findOne({
      _id: trainer.branchId,
      organizationId: tenantId,
      status: 'active'
    });
    if (!branch) {
      throw new AppError('Trainer assigned branch is currently inactive or not found', 400);
    }

    // Check 3: Member must exist and be ACTIVE
    const member = await db.collection('members').findOne({
      _id: targetMemberId,
      organizationId: tenantId,
      status: 'active'
    });
    if (!member) {
      throw new AppError('Active member profile not found in your organization', 404);
    }

    // Check 4: Member Membership & Branch Access Tier Validation
    const candidateMemberships = await db
      .collection('memberships')
      .find({
        organizationId: tenantId,
        memberId: targetMemberId,
        status: 'active'
      })
      .toArray();

    const validMemberships = candidateMemberships.filter((m: any) =>
      isMembershipValidUtc(m.startDate, m.endDate, m.status, dto.sessionDate)
    );

    if (validMemberships.length === 0) {
      throw new AppError(
        'Forbidden: No active and valid membership covering the session date',
        403
      );
    }

    // Branch tier check against trainer.branchId
    const planIds = validMemberships.map((m: any) => m.planId);
    const plans = await db
      .collection('membershipPlans')
      .find({
        _id: { $in: planIds },
        organizationId: tenantId
      })
      .toArray();

    const planMap = new Map<string, any>(plans.map((p: any) => [p._id.toString(), p]));

    let isBranchAuthorized = false;
    for (const m of validMemberships) {
      const plan = planMap.get(m.planId.toString());
      if (!plan) continue;

      if (plan.branchAccess === 'all_branches') {
        isBranchAuthorized = true;
        break;
      } else if (
        plan.branchAccess === 'single_branch' &&
        m.branchId.toString() === trainer.branchId.toString()
      ) {
        isBranchAuthorized = true;
        break;
      }
    }

    if (!isBranchAuthorized) {
      throw new AppError(
        'Forbidden: Member membership does not grant access to the trainer branch',
        403
      );
    }

    // 4. Availability Schedule Matching
    const dayOfWeek = getDayOfWeekFromUtcDate(dto.sessionDate);
    const slots = await db
      .collection<TrainerAvailabilityDocument>('trainerAvailability')
      .find({
        organizationId: tenantId,
        trainerId: trainerObjectId,
        dayOfWeek: dayOfWeek as DayOfWeek
      })
      .toArray();

    // Must be fully enclosed in an available slot
    const matchingAvailableSlot = slots.find(
      (s) =>
        s.status === 'available' &&
        s.startTime <= dto.startTime &&
        dto.endTime <= s.endTime
    );

    if (!matchingAvailableSlot) {
      throw new AppError(
        'Requested session time is outside the trainer available working hours',
        400
      );
    }

    // Must not overlap any unavailable slot
    const overlappingUnavailableSlot = slots.find(
      (s) =>
        s.status === 'unavailable' &&
        s.startTime < dto.endTime &&
        s.endTime > dto.startTime
    );

    if (overlappingUnavailableSlot) {
      throw new AppError(
        'Requested session time falls within a blocked unavailable time window',
        400
      );
    }

    // 5. Concurrency & Overlap Prevention (Application Level)
    // Trainer double-booking
    const trainerOverlapping = await db
      .collection<TrainerSessionDocument>('trainerSessions')
      .findOne({
        organizationId: tenantId,
        trainerId: trainerObjectId,
        sessionDate: dto.sessionDate,
        status: 'scheduled',
        startTime: { $lt: dto.endTime },
        endTime: { $gt: dto.startTime }
      });

    if (trainerOverlapping) {
      throw new AppError(
        'Trainer already has a scheduled session during this time window',
        409
      );
    }

    // Member double-booking
    const memberOverlapping = await db
      .collection<TrainerSessionDocument>('trainerSessions')
      .findOne({
        organizationId: tenantId,
        memberId: targetMemberId,
        sessionDate: dto.sessionDate,
        status: 'scheduled',
        startTime: { $lt: dto.endTime },
        endTime: { $gt: dto.startTime }
      });

    if (memberOverlapping) {
      throw new AppError(
        'Member already has a scheduled session during this time window',
        409
      );
    }

    // 6. Insert new session document
    const newSession: TrainerSessionDocument = {
      organizationId: tenantId,
      branchId: trainer.branchId, // Strictly derived from trainer
      trainerId: trainerObjectId,
      memberId: targetMemberId,
      sessionDate: dto.sessionDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      sessionType: dto.sessionType.trim(),
      status: 'scheduled',
      notes: dto.notes ? dto.notes.trim() : ''
    };

    const result = await db.collection('trainerSessions').insertOne(newSession as any);
    newSession._id = result.insertedId;

    return newSession;
  }

  /**
   * Update session status (completed or cancelled).
   */
  static async updateSessionStatus(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    sessionId: string,
    newStatus: SessionStatus
  ): Promise<TrainerSessionDocument> {
    if (!ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }
    if (!['completed', 'cancelled'].includes(newStatus)) {
      throw new AppError('Invalid status update. Allowed: completed, cancelled', 400);
    }

    const db = dbConnection.getDb();
    const sessionObjectId = new ObjectId(sessionId);

    const session = await db
      .collection<TrainerSessionDocument>('trainerSessions')
      .findOne({
        _id: sessionObjectId,
        organizationId: tenantId
      });

    if (!session) {
      throw new AppError('Trainer session not found', 404);
    }

    // Terminal state protection
    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new AppError('Cannot modify status of a completed or cancelled session', 400);
    }

    // Member role restrictions
    if (callerRole === 'member') {
      if (!callerMemberId || session.memberId.toString() !== callerMemberId) {
        throw new AppError('Forbidden: You can only modify your own sessions', 403);
      }
      if (newStatus !== 'cancelled') {
        throw new AppError('Forbidden: Members can only cancel scheduled sessions', 403);
      }
    }

    await db.collection('trainerSessions').updateOne(
      { _id: sessionObjectId },
      { $set: { status: newStatus } }
    );

    return {
      ...session,
      status: newStatus
    };
  }

  /**
   * List sessions with role-based scoping.
   */
  static async listSessions(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    query: SessionQuery
  ): Promise<TrainerSessionDocument[]> {
    const db = dbConnection.getDb();
    const filter: any = { organizationId: tenantId };

    if (callerRole === 'member') {
      if (!callerMemberId || !ObjectId.isValid(callerMemberId)) {
        throw new AppError('Forbidden: Member profile not linked', 403);
      }
      if (query.memberId && query.memberId !== callerMemberId) {
        throw new AppError('Forbidden: Members can only view their own sessions', 403);
      }
      filter.memberId = new ObjectId(callerMemberId);
    } else {
      if (query.memberId && ObjectId.isValid(query.memberId)) {
        filter.memberId = new ObjectId(query.memberId);
      }
    }

    if (query.trainerId && ObjectId.isValid(query.trainerId)) {
      filter.trainerId = new ObjectId(query.trainerId);
    }
    if (query.branchId && ObjectId.isValid(query.branchId)) {
      filter.branchId = new ObjectId(query.branchId);
    }
    if (query.sessionDate && isValidUtcDateString(query.sessionDate)) {
      filter.sessionDate = query.sessionDate;
    }
    if (query.status && ['scheduled', 'completed', 'cancelled'].includes(query.status)) {
      filter.status = query.status;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    return db
      .collection<TrainerSessionDocument>('trainerSessions')
      .find(filter)
      .sort({ sessionDate: -1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieve single session by ID.
   */
  static async getSessionById(
    tenantId: ObjectId,
    callerRole: string,
    callerMemberId: string | undefined,
    sessionId: string
  ): Promise<TrainerSessionDocument> {
    if (!ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }
    const db = dbConnection.getDb();
    const session = await db
      .collection<TrainerSessionDocument>('trainerSessions')
      .findOne({
        _id: new ObjectId(sessionId),
        organizationId: tenantId
      });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (callerRole === 'member') {
      if (!callerMemberId || session.memberId.toString() !== callerMemberId) {
        throw new AppError('Forbidden: You can only view your own sessions', 403);
      }
    }

    return session;
  }

  static async deleteTrainer(
    tenantId: ObjectId | undefined,
    trainerId: string
  ): Promise<boolean> {
    if (!ObjectId.isValid(trainerId)) {
      throw new AppError('Invalid trainerId', 400);
    }
    const db = dbConnection.getDb();
    const query: any = { _id: new ObjectId(trainerId) };
    if (tenantId) {
      query.organizationId = tenantId;
    }
    const result = await db.collection('trainers').deleteOne(query);
    if (result.deletedCount === 0) {
      throw new AppError('Trainer not found or already deleted', 404);
    }
    await db.collection('Users').deleteOne({ trainerId: new ObjectId(trainerId) });
    return true;
  }
}
