import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import * as memberService from '../services/memberService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export const listMembers = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role === 'member') {
      // Member can only view their own profile
      if (!req.user?.userId) {
        throw new AppError('Authentication required.', 401);
      }
      const member = await memberService.getMemberById(
        req.tenantId!,
        new ObjectId((req.user as any).memberId || req.user.userId)
      );
      res.status(200).json({
        success: true,
        data: { members: [member] }
      });
      return;
    }

    const isGlobalAdmin = req.user?.isGlobal || req.user?.email === 'admin@gym360.com';
    const userBranchId = req.user?.branchId && ObjectId.isValid(req.user.branchId)
      ? new ObjectId(req.user.branchId)
      : undefined;

    let filterBranchId: ObjectId | undefined = userBranchId;
    if (!filterBranchId && req.query.branchId && typeof req.query.branchId === 'string' && ObjectId.isValid(req.query.branchId)) {
      filterBranchId = new ObjectId(req.query.branchId);
    }

    const tenantToFilter = isGlobalAdmin ? undefined : req.tenantId;

    const members = await memberService.listMembers(
      tenantToFilter,
      filterBranchId
    );
    res.status(200).json({
      success: true,
      data: { members }
    });
  } catch (error) {
    next(error);
  }
};

export const getMember = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberIdStr = getParamId(req.params.memberId, 'memberId');

    // If caller is member, enforce that they can only view their own record
    if (req.user?.role === 'member') {
      const userMemberId = (req.user as any).memberId;
      if (!userMemberId || userMemberId !== memberIdStr) {
        throw new AppError('Access denied: You are only permitted to view your own member profile.', 403);
      }
    }

    const member = await memberService.getMemberById(
      req.user?.role === 'admin' ? undefined : req.tenantId!,
      new ObjectId(memberIdStr)
    );
    res.status(200).json({
      success: true,
      data: { member }
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newMember = await memberService.createMember(req.tenantId!, req.body);
    res.status(201).json({
      success: true,
      message: 'Member profile created successfully',
      data: { member: newMember }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberIdStr = getParamId(req.params.memberId, 'memberId');
    const memberObjectId = new ObjectId(memberIdStr);

    if (req.user?.role === 'member') {
      const userMemberId = (req.user as any).memberId;
      if (!userMemberId || userMemberId !== memberIdStr) {
        throw new AppError('Access denied: You can only update your own member profile.', 403);
      }

      // Member self-update: only personal fields permitted
      const updatedMember = await memberService.updateMemberSelf(
        req.tenantId!,
        memberObjectId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Personal profile updated successfully',
        data: { member: updatedMember }
      });
      return;
    }

    // Admin update: can update all profile fields including branch reassignment
    const updatedMember = await memberService.updateMemberAsAdmin(
      req.tenantId!,
      memberObjectId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Member profile updated successfully',
      data: { member: updatedMember }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberStatus = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberIdStr = getParamId(req.params.memberId, 'memberId');
    const status = req.body.status;
    const updatedMember = await memberService.updateMemberAsAdmin(
      req.tenantId!,
      new ObjectId(memberIdStr),
      { status }
    );
    res.status(200).json({
      success: true,
      message: `Member status updated to ${status}`,
      data: { member: updatedMember }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberIdStr = getParamId(req.params.memberId, 'memberId');
    const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
    await memberService.deleteMember(tenant, new ObjectId(memberIdStr));
    res.status(200).json({
      success: true,
      message: 'Member deleted successfully from database',
    });
  } catch (error) {
    next(error);
  }
};
