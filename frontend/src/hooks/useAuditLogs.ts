import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../api/auditLogApi';
import { AuditLogFilterParams } from '../types/auditLog.types';

export const useAuditLogs = (filters?: AuditLogFilterParams) => {
  return useQuery({
    queryKey: ['auditLogs', filters ?? {}],
    queryFn: () => auditLogApi.listAuditLogs(filters),
  });
};
