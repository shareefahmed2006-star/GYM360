import { Response, NextFunction } from 'express';
import { AuthorizedRequest } from '../types/authorization';
import * as organizationService from '../services/organizationService';

export const getOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const org = await organizationService.getOrganization(req.tenantId!);
    res.status(200).json({
      success: true,
      data: { organization: org }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updatedOrg = await organizationService.updateOrganization(req.tenantId!, req.body);
    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization: updatedOrg }
    });
  } catch (error) {
    next(error);
  }
};
