import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import * as membershipService from '../services/membershipService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export const listMemberships = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let filterMemberId: ObjectId | undefined;
    if (req.user?.role === 'member') {
      const userMemberId = (req.user as any).memberId;
      if (!userMemberId) {
        throw new AppError('User account is not linked to a member profile.', 403);
      }
      filterMemberId = new ObjectId(userMemberId);
    } else if (req.query.memberId && typeof req.query.memberId === 'string' && ObjectId.isValid(req.query.memberId)) {
      filterMemberId = new ObjectId(req.query.memberId);
    }

    const memberships = await membershipService.listMemberships(
      req.user?.role === 'admin' ? undefined : req.tenantId!,
      filterMemberId
    );
    res.status(200).json({
      success: true,
      data: { memberships }
    });
  } catch (error) {
    next(error);
  }
};

export const getMembership = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const membershipIdStr = getParamId(req.params.membershipId, 'membershipId');
    const membership = await membershipService.getMembershipById(
      req.tenantId!,
      new ObjectId(membershipIdStr)
    );

    // If caller is member, verify ownership
    if (req.user?.role === 'member') {
      const userMemberId = (req.user as any).memberId;
      if (!userMemberId || membership.memberId.toHexString() !== userMemberId) {
        throw new AppError('Access denied: You are only permitted to view your own memberships.', 403);
      }
    }

    res.status(200).json({
      success: true,
      data: { membership }
    });
  } catch (error) {
    next(error);
  }
};

export const createMembership = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const newMembership = await membershipService.createMembership(
      req.tenantId!,
      callerRole,
      callerMemberId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Membership subscription created successfully',
      data: { membership: newMembership }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMembership = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const membershipIdStr = getParamId(req.params.membershipId, 'membershipId');
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const cancelledMembership = await membershipService.cancelMembership(
      req.tenantId!,
      new ObjectId(membershipIdStr),
      callerRole,
      callerMemberId
    );

    res.status(200).json({
      success: true,
      message: 'Membership subscription cancelled successfully',
      data: { membership: cancelledMembership }
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringMemberships = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawDays = req.query.daysAhead || req.query.days;
    const daysAhead = rawDays ? parseInt(rawDays as string, 10) : 14;
    let memberId: ObjectId | undefined;

    if (req.user?.role === 'member') {
      const userMemberId = (req.user as any).memberId;
      if (userMemberId) {
        memberId = new ObjectId(userMemberId);
      }
    } else if (req.query.memberId && typeof req.query.memberId === 'string' && ObjectId.isValid(req.query.memberId)) {
      memberId = new ObjectId(req.query.memberId);
    }

    const expiring = await membershipService.getExpiringMemberships(daysAhead, memberId);

    res.status(200).json({
      success: true,
      count: expiring.length,
      data: {
        expiringMemberships: expiring,
      },
      expiringMemberships: expiring,
    });
  } catch (error) {
    next(error);
  }
};

export const renewMembership = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const membershipIdStr = getParamId(req.params.membershipId, 'membershipId');
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const result = await membershipService.renewMembership(
      req.tenantId!,
      new ObjectId(membershipIdStr),
      callerRole,
      callerMemberId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMembership = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const membershipIdStr = getParamId(req.params.membershipId, 'membershipId');
    const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
    await membershipService.deleteMembership(tenant, new ObjectId(membershipIdStr));
    res.status(200).json({
      success: true,
      message: 'Membership deleted successfully from database',
    });
  } catch (error) {
    next(error);
  }
};
