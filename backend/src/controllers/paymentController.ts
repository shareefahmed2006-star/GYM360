import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import * as paymentService from '../services/paymentService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export const listPayments = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const filters = {
      branchId: typeof req.query.branchId === 'string' ? req.query.branchId : undefined,
      memberId: typeof req.query.memberId === 'string' ? req.query.memberId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      paymentMethod: typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined
    };

    const isGlobalAdmin = req.user?.isGlobal || req.user?.email === 'admin@gym360.com';
    if (!isGlobalAdmin && req.user?.branchId) {
      filters.branchId = req.user.branchId;
    }

    const payments = await paymentService.listPayments(
      isGlobalAdmin ? undefined : req.tenantId!,
      callerRole,
      callerMemberId,
      filters
    );

    res.status(200).json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const paymentIdStr = getParamId(req.params.paymentId, 'paymentId');
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const payment = await paymentService.getPaymentById(
      req.tenantId!,
      new ObjectId(paymentIdStr),
      callerRole,
      callerMemberId
    );

    res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callerRole = req.user?.role || 'member';
    const callerMemberId = (req.user as any)?.memberId;

    const newPayment = await paymentService.createPayment(
      req.tenantId!,
      callerRole,
      callerMemberId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment: newPayment }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const paymentIdStr = getParamId(req.params.paymentId, 'paymentId');
    const newStatus = req.body.status;

    if (!newStatus) {
      throw new AppError('Status is required.', 400);
    }

    const updatedPayment = await paymentService.updatePaymentStatus(
      req.tenantId!,
      new ObjectId(paymentIdStr),
      newStatus
    );

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${newStatus}`,
      data: { payment: updatedPayment }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const paymentIdStr = getParamId(req.params.paymentId, 'paymentId');
    const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
    await paymentService.deletePayment(tenant, new ObjectId(paymentIdStr));
    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully from database',
    });
  } catch (error) {
    next(error);
  }
};
