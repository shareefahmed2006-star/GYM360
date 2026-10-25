import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  X,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useBranches } from '../../hooks/useBranches';
import { AuditLogDetailModal } from '../../components/audit/AuditLogDetailModal';
import { AuditLogDocument } from '../../types/auditLog.types';

export const AuditLogListPage: React.FC = () => {
  // 1. Filter States
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const limit = 50;

  // 2. Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogDocument | null>(null);

  // 3. Server Filters Object
  const apiFilters = useMemo(() => {
    const filters: {
      branchId?: string;
      entityType?: string;
      action?: string;
      date?: string;
      page?: number;
      limit?: number;
    } = {
      page: currentPage,
      limit,
    };

    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (entityTypeFilter !== 'all') filters.entityType = entityTypeFilter;
    if (actionFilter !== 'all') filters.action = actionFilter;
    if (dateFilter.trim()) filters.date = dateFilter.trim();

    return filters;
  }, [branchFilter, entityTypeFilter, actionFilter, dateFilter, currentPage, limit]);

  // 4. Data Query
  const {
    data: auditResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAuditLogs(apiFilters);

  const { data: branches = [] } = useBranches();

  // Branch mapping for human-readable names
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  const rawLogs = auditResponse?.data || [];
  const serverTotalCount = auditResponse?.total ?? 0;
  const totalPages = auditResponse?.totalPages || 1;
  const loadedCount = auditResponse?.count ?? rawLogs.length;

  // Extract distinct Entity Types from loaded data to enrich filter
  const availableEntityTypes = useMemo(() => {
    const set = new Set<string>(['equipment', 'maintenance', 'notification', 'system_security']);
    rawLogs.forEach((l) => {
      if (l.entityType) set.add(l.entityType);
    });
    return Array.from(set).sort();
  }, [rawLogs]);

  // Extract distinct Actions from loaded data
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    rawLogs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [rawLogs]);

  // 5. Client-side Search (strictly scoped to current loaded page)
  const filteredLogs = useMemo(() => {
    if (!clientSearchTerm.trim()) return rawLogs;
    const term = clientSearchTerm.toLowerCase();
    return rawLogs.filter((log) => {
      const matchAction = log.action?.toLowerCase().includes(term);
      const matchDesc = log.description?.toLowerCase().includes(term);
      const matchEntityId = log.entityId?.toLowerCase().includes(term);
      const matchUserId = log.userId?.toLowerCase().includes(term);
      const matchType = log.entityType?.toLowerCase().includes(term);
      return matchAction || matchDesc || matchEntityId || matchUserId || matchType;
    });
  }, [rawLogs, clientSearchTerm]);

  // Reset pagination on filter change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setBranchFilter('all');
    setEntityTypeFilter('all');
    setActionFilter('all');
    setDateFilter('');
    setClientSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    branchFilter !== 'all' ||
    entityTypeFilter !== 'all' ||
    actionFilter !== 'all' ||
    Boolean(dateFilter) ||
    Boolean(clientSearchTerm);

  // Semantic pill styling for action type
  const getActionBadge = (action: string) => {
    if (action.includes('CREATED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('STATUS')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('UPDATED')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('SECURITY') || action.includes('AUTH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
              <ShieldAlert className="w-4 h-4" />
              Compliance & Security Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Security Audit Trail
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Immutable historical logs tracking operational actions, resource modifications, and security verification checks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-purple-600' : ''}`}
              />
              {isFetching ? 'Syncing Logs...' : 'Sync Logs'}
            </button>
          </div>
        </div>

        {/* 2. Metrics & Compliance Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Organization Total
            </span>
            <span className="text-xl font-extrabold text-gray-900 font-mono mt-0.5 block">
              {serverTotalCount}
            </span>
            <span className="text-[10px] text-gray-400">Total recorded compliance events</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Current Page Loaded
            </span>
            <span className="text-xl font-extrabold text-purple-700 font-mono mt-0.5 block">
              {loadedCount}
            </span>
            <span className="text-[10px] text-gray-400">
              Page {currentPage} of {totalPages} (Limit: {limit}/page)
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Record Integrity
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-1">
                <Lock className="w-3.5 h-3.5" />
                Immutable Append-Only
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Zero alteration or deletion permitted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Server Filters & Client Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            Audit Log Filters
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Branch Filter */}
          <div className="space-y-1">
            <label htmlFor="branch-filter" className="text-gray-500 font-medium block">
              Branch Scope
            </label>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                id="branch-filter"
                value={branchFilter}
                onChange={(e) => handleFilterChange(setBranchFilter, e.target.value)}
                className="bg-transparent border-0 text-gray-800 font-semibold focus:outline-hidden w-full cursor-pointer"
              >
                <option value="all">All Branches (Organization-Wide)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-1">
            <label htmlFor="entity-filter" className="text-gray-500 font-medium block">
              Entity Type
            </label>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                id="entity-filter"
                value={entityTypeFilter}
                onChange={(e) => handleFilterChange(setEntityTypeFilter, e.target.value)}
                className="bg-transparent border-0 text-gray-800 font-semibold focus:outline-hidden w-full cursor-pointer"
              >
                <option value="all">All Entity Types</option>
                {availableEntityTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Filter */}
          <div className="space-y-1">
            <label htmlFor="action-filter" className="text-gray-500 font-medium block">
              Action Name
            </label>
            <select
              id="action-filter"
              value={actionFilter}
              onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-semibold focus:outline-hidden w-full cursor-pointer h-[34px]"
            >
              <option value="all">All Actions</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter (Exact YYYY-MM-DD supported by backend) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="date-filter" className="text-gray-500 font-medium block">
                Exact Date (UTC)
              </label>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => handleFilterChange(setDateFilter, '')}
                  className="text-[10px] text-gray-400 hover:text-gray-700"
                >
                  All Dates
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
                className="bg-transparent border-0 text-gray-800 font-semibold focus:outline-hidden w-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Client Search Bar with Explicit Page-Only Scope Notice */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search loaded page by action, description, or ID..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="text-[11px] text-gray-400 italic shrink-0">
            {clientSearchTerm.trim() ? (
              <span className="text-purple-700 font-medium not-italic">
                Showing {filteredLogs.length} of {loadedCount} loaded records on page
              </span>
            ) : (
              <span>Client search applies to currently loaded page only</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              Failed to load Security Audit Trail
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {error instanceof Error ? error.message : 'An error occurred while fetching audit records.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto border border-gray-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              No Audit Records Found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No audit log entries matched the selected filters. Try broadening your criteria.'
                : 'No audit records have been emitted for this organization yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Affected Resource</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Responsible Actor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  const branchName = branchMap.get(log.branchId);

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">
                        {log.createdAt}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {log.entityType}
                        </span>
                      </td>

                      {/* Affected Resource ID */}
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {log.entityId ? (
                          <span title={log.entityId}>
                            ...{log.entityId.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4 text-gray-800 whitespace-nowrap">
                        {branchName ? (
                          <span className="font-medium">{branchName}</span>
                        ) : log.branchId ? (
                          <span className="font-mono text-gray-500 text-[11px]">
                            ...{log.branchId.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Org-Wide</span>
                        )}
                      </td>

                      {/* Actor User ID */}
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {log.userId ? (
                          <span title={log.userId}>
                            ...{log.userId.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>

                      {/* Narrative Description (Plain text) */}
                      <td className="py-3 px-4 text-gray-900 max-w-xs truncate" title={log.description}>
                        {log.description || '—'}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-900 font-mono">{filteredLogs.length}</strong> of{' '}
            <strong className="text-gray-900 font-mono">{serverTotalCount}</strong> matching organization records
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isFetching}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="px-2 font-mono font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isFetching}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          branchName={branchMap.get(selectedLog.branchId)}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};
