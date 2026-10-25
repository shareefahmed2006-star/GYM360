import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AuthorizedRequest } from '../types/authorization';
import { AppError } from '../middleware/errorHandler';
import {
  TrainerDocument,
  TrainerSessionDocument,
  TrainerAvailabilityDocument,
} from '../types/trainer';

const getTodayUtc = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFirstDayOfMonthUtc = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export class TrainerPortalController {
  private static getTrainerContext(req: AuthorizedRequest): {
    tenantId: ObjectId;
    trainerId: ObjectId;
  } {
    if (!req.tenantId || !req.user) {
      throw new AppError('Unauthorized: Missing tenant or user context', 401);
    }
    if (req.user.role !== 'trainer') {
      throw new AppError('Access denied: Trainer role required', 403);
    }
    const rawTrainerId = (req.user as any).trainerId;
    if (!rawTrainerId || !ObjectId.isValid(rawTrainerId)) {
      throw new AppError('Forbidden: Trainer profile not linked to user account', 403);
    }
    return {
      tenantId: req.tenantId,
      trainerId: new ObjectId(rawTrainerId),
    };
  }

  static async getDashboard(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tenantId, trainerId } = TrainerPortalController.getTrainerContext(req);
      const db = dbConnection.getDb();

      // 1. Fetch trainer profile
      const trainer = await db.collection<TrainerDocument>('trainers').findOne({
        _id: trainerId,
        organizationId: tenantId,
      });
      if (!trainer) {
        throw new AppError('Trainer profile not found in this organization', 404);
      }

      // 2. Fetch branch details
      const branch = await db.collection('branches').findOne({
        _id: trainer.branchId,
        organizationId: tenantId,
      });

      const today = getTodayUtc();
      const firstOfMonth = getFirstDayOfMonthUtc();

      // 3. Query trainer sessions
      const allSessions = await db
        .collection<TrainerSessionDocument>('trainerSessions')
        .find({
          trainerId,
          organizationId: tenantId,
        })
        .sort({ sessionDate: 1, startTime: 1 })
        .toArray();

      // 4. Enrich sessions with member details
      const memberIds = [...new Set(allSessions.map((s) => s.memberId?.toString()).filter(Boolean))];
      const members = await db
        .collection('members')
        .find({
          _id: { $in: memberIds.map((id) => new ObjectId(id)) },
          organizationId: tenantId,
        })
        .toArray();

      const memberMap = new Map<string, any>();
      members.forEach((m) => memberMap.set(m._id.toHexString(), m));

      const enrichedSessions = allSessions.map((s: any) => {
        const mem = memberMap.get(s.memberId?.toString());
        return {
          ...s,
          member: mem
            ? {
                id: mem._id.toHexString(),
                firstName: mem.firstName,
                lastName: mem.lastName,
                email: mem.email,
                phone: mem.phone,
              }
            : null,
        };
      });

      // 5. Filter session horizons
      const todaySessions = enrichedSessions.filter((s: any) => s.sessionDate === today);
      const upcomingSessions = enrichedSessions.filter(
        (s: any) => s.sessionDate >= today && s.status === 'scheduled'
      );
      const completedSessionsMtd = enrichedSessions.filter(
        (s: any) => s.sessionDate >= firstOfMonth && s.status === 'completed'
      );

      // 6. Availability slots
      const availabilitySlots = await db
        .collection<TrainerAvailabilityDocument>('trainerAvailability')
        .find({
          trainerId,
          organizationId: tenantId,
        })
        .toArray();

      // 7. Distinct active clients
      const uniqueClients = new Set(
        enrichedSessions.map((s: any) => s.memberId?.toString()).filter(Boolean)
      );

      res.status(200).json({
        success: true,
        data: {
          trainer: {
            id: trainer._id ? trainer._id.toHexString() : trainerId.toHexString(),
            firstName: trainer.firstName,
            lastName: trainer.lastName,
            email: trainer.email,
            phone: trainer.phone,
            specialization: trainer.specialization,
            experienceYears: trainer.experienceYears,
            bio: trainer.bio,
            status: trainer.status,
            branch: branch
              ? {
                  id: branch._id.toHexString(),
                  name: branch.name,
                }
              : null,
          },
          stats: {
            todaySessionsCount: todaySessions.length,
            activeClientsCount: uniqueClients.size,
            completedSessionsMtd: completedSessionsMtd.length,
            weeklySlotsCount: availabilitySlots.length,
          },
          todaySessions,
          upcomingSessions: upcomingSessions.slice(0, 10),
          availabilitySlots,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listSessions(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tenantId, trainerId } = TrainerPortalController.getTrainerContext(req);
      const db = dbConnection.getDb();

      const query: any = {
        trainerId,
        organizationId: tenantId,
      };

      if (req.query.status && typeof req.query.status === 'string') {
        query.status = req.query.status;
      }
      if (req.query.date && typeof req.query.date === 'string') {
        query.sessionDate = req.query.date;
      }

      const sessions = await db
        .collection<TrainerSessionDocument>('trainerSessions')
        .find(query)
        .sort({ sessionDate: -1, startTime: -1 })
        .toArray();

      const memberIds = [...new Set(sessions.map((s) => s.memberId?.toString()).filter(Boolean))];
      const members = await db
        .collection('members')
        .find({
          _id: { $in: memberIds.map((id) => new ObjectId(id)) },
          organizationId: tenantId,
        })
        .toArray();

      const memberMap = new Map<string, any>();
      members.forEach((m) => memberMap.set(m._id.toHexString(), m));

      const enriched = sessions.map((s: any) => {
        const mem = memberMap.get(s.memberId?.toString());
        return {
          ...s,
          member: mem
            ? {
                id: mem._id.toHexString(),
                firstName: mem.firstName,
                lastName: mem.lastName,
                email: mem.email,
                phone: mem.phone,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        count: enriched.length,
        data: { sessions: enriched },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSessionStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tenantId, trainerId } = TrainerPortalController.getTrainerContext(req);
      const db = dbConnection.getDb();
      const rawSessionId = req.params.sessionId;
      const sessionIdStr = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

      if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
        throw new AppError('Invalid session identifier', 400);
      }
      const sessionObjectId = new ObjectId(sessionIdStr);

      const { status, notes } = req.body;
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'in-progress'];
      if (!status || !validStatuses.includes(status)) {
        throw new AppError(
          `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
          400
        );
      }

      const existingSession = await db.collection('trainerSessions').findOne({
        _id: sessionObjectId,
        trainerId,
        organizationId: tenantId,
      });

      if (!existingSession) {
        throw new AppError(
          'Trainer session not found or you are not authorized to update it',
          404
        );
      }

      const updateDoc: any = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (notes !== undefined) {
        updateDoc.notes = notes;
      }

      await db.collection('trainerSessions').updateOne(
        { _id: sessionObjectId },
        { $set: updateDoc }
      );

      const updated = await db.collection('trainerSessions').findOne({
        _id: sessionObjectId,
      });

      res.status(200).json({
        success: true,
        message: `Session status updated to ${status}`,
        data: { session: updated },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listClients(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tenantId, trainerId } = TrainerPortalController.getTrainerContext(req);
      const db = dbConnection.getDb();

      // Find all sessions for this trainer
      const sessions = await db
        .collection<TrainerSessionDocument>('trainerSessions')
        .find({
          trainerId,
          organizationId: tenantId,
        })
        .toArray();

      const memberIds = [...new Set(sessions.map((s) => s.memberId?.toString()).filter(Boolean))];
      const members = await db
        .collection('members')
        .find({
          _id: { $in: memberIds.map((id) => new ObjectId(id)) },
          organizationId: tenantId,
        })
        .toArray();

      // Aggregate session metrics per client
      const clientStats = members.map((m: any) => {
        const clientSessions = sessions.filter(
          (s) => s.memberId?.toString() === m._id.toHexString()
        );
        const completed = clientSessions.filter((s) => s.status === 'completed').length;
        const upcoming = clientSessions.filter((s) => s.status === 'scheduled').length;
        const lastSession = [...clientSessions]
          .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0];

        return {
          id: m._id.toHexString(),
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          status: m.status,
          totalSessions: clientSessions.length,
          completedSessions: completed,
          upcomingSessions: upcoming,
          lastSessionDate: lastSession ? lastSession.sessionDate : null,
          lastSessionType: lastSession ? lastSession.sessionType : null,
        };
      });

      res.status(200).json({
        success: true,
        count: clientStats.length,
        data: { clients: clientStats },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAvailability(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tenantId, trainerId } = TrainerPortalController.getTrainerContext(req);
      const db = dbConnection.getDb();

      const slots = await db
        .collection<TrainerAvailabilityDocument>('trainerAvailability')
        .find({
          trainerId,
          organizationId: tenantId,
        })
        .sort({ dayOfWeek: 1, startTime: 1 })
        .toArray();

      res.status(200).json({
        success: true,
        count: slots.length,
        data: { availability: slots },
      });
    } catch (err) {
      next(err);
    }
  }
}
