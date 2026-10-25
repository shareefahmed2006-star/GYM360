import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { AuthorizedRequest } from '../types/authorization';
import * as branchService from '../services/branchService';
import { AppError } from '../middleware/errorHandler';

const getParamBranchId = (raw: string | string[] | undefined): string => {
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  if (!branchId || typeof branchId !== 'string' || !ObjectId.isValid(branchId)) {
    throw new AppError('Invalid branch identifier format.', 400);
  }
  return branchId;
};

export const listBranches = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branches = await branchService.listBranches(
      req.user?.role === 'admin' ? undefined : req.tenantId!
    );
    res.status(200).json({
      success: true,
      data: { branches }
    });
  } catch (error) {
    next(error);
  }
};

export const getBranch = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchIdStr = getParamBranchId(req.params.branchId);
    const branch = await branchService.getBranchById(
      req.user?.role === 'admin' ? undefined : req.tenantId!,
      new ObjectId(branchIdStr)
    );
    res.status(200).json({
      success: true,
      data: { branch }
    });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newBranch = await branchService.createBranch(req.tenantId!, req.body);
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: { branch: newBranch }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchIdStr = getParamBranchId(req.params.branchId);
    const updatedBranch = await branchService.updateBranch(
      req.tenantId!,
      new ObjectId(branchIdStr),
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: { branch: updatedBranch }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranchStatus = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchIdStr = getParamBranchId(req.params.branchId);
    const status = req.body.status;
    const updatedBranch = await branchService.updateBranchStatus(
      req.tenantId!,
      new ObjectId(branchIdStr),
      status
    );
    res.status(200).json({
      success: true,
      message: `Branch status updated to ${status}`,
      data: { branch: updatedBranch }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchIdStr = getParamBranchId(req.params.branchId);
    const tenant = req.user?.role === 'admin' ? undefined : req.tenantId;
    await branchService.deleteBranch(tenant, new ObjectId(branchIdStr));
    res.status(200).json({
      success: true,
      message: 'Branch deleted successfully from database',
    });
  } catch (error) {
    next(error);
  }
};
