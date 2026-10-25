import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import * as planService from '../services/membershipPlanService';
import { AppError } from '../middleware/errorHandler';

const getParamId = (raw: string | string[] | undefined, name: string): string => {
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (!idStr || typeof idStr !== 'string' || !ObjectId.isValid(idStr)) {
    throw new AppError(`Invalid ${name} format. Expected 24-character hex ObjectId.`, 400);
  }
  return idStr;
};

export const listPlans = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const onlyActive = req.user?.role === 'member';
    const plans = await planService.listPlans(
      req.user?.role === 'admin' ? undefined : req.tenantId!,
      onlyActive
    );
    res.status(200).json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};

export const getPlan = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const planIdStr = getParamId(req.params.planId, 'planId');
    const plan = await planService.getPlanById(req.tenantId!, new ObjectId(planIdStr));
    res.status(200).json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newPlan = await planService.createPlan(req.tenantId!, req.body);
    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: { plan: newPlan }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const planIdStr = getParamId(req.params.planId, 'planId');
    const updatedPlan = await planService.updatePlan(
      req.tenantId!,
      new ObjectId(planIdStr),
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Membership plan updated successfully',
      data: { plan: updatedPlan }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlanStatus = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const planIdStr = getParamId(req.params.planId, 'planId');
    const status = req.body.status;
    const updatedPlan = await planService.updatePlanStatus(
      req.tenantId!,
      new ObjectId(planIdStr),
      status
    );
    res.status(200).json({
      success: true,
      message: `Membership plan status updated to ${status}`,
      data: { plan: updatedPlan }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const planIdStr = getParamId(req.params.planId, 'planId');
    const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
    await planService.deletePlan(tenant, new ObjectId(planIdStr));
    res.status(200).json({
      success: true,
      message: 'Membership plan deleted successfully from database',
    });
  } catch (error) {
    next(error);
  }
};
