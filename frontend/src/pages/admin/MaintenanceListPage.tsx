import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Dumbbell,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useMaintenanceLogs, useDeleteMaintenanceLog } from '../../hooks/useMaintenance';
import { useBranches } from '../../hooks/useBranches';
import { useEquipmentList } from '../../hooks/useEquipment';
import { CreateMaintenanceModal } from '../../components/maintenance/CreateMaintenanceModal';
import { EditMaintenanceModal } from '../../components/maintenance/EditMaintenanceModal';
import { MaintenanceStatusModal } from '../../components/maintenance/MaintenanceStatusModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { MaintenanceLogDocument, MaintenanceLogStatus } from '../../types/maintenance.types';

export const MaintenanceListPage: React.FC = () => {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 50;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingLog, setDeletingLog] = useState<MaintenanceLogDocument | null>(null);
  const [selectedLogForEdit, setSelectedLogForEdit] =
    useState<MaintenanceLogDocument | null>(null);
  const [selectedLogForStatus, setSelectedLogForStatus] =
    useState<MaintenanceLogDocument | null>(null);

  const deleteLogMutation = useDeleteMaintenanceLog();

  // Server-supported filters
  const apiFilters = useMemo(() => {
    const filters: {
      branchId?: string;
      status?: string;
      equipmentId?: string;
      page?: number;
      limit?: number;
    } = {
      page: currentPage,
      limit,
    };
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (equipmentFilter !== 'all') filters.equipmentId = equipmentFilter;
    return filters;
  }, [branchFilter, statusFilter, equipmentFilter, currentPage, limit]);

  const {
    data: logsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMaintenanceLogs(apiFilters);

  const { data: branches = [] } = useBranches();
  const { data: equipmentResponse } = useEquipmentList({ limit: 100 });

  const equipmentList = equipmentResponse?.data || [];

  // Mappings for human-readable labels
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  const equipmentMap = useMemo(() => {
    return new Map(equipmentList.map((e) => [e._id, e]));
  }, [equipmentList]);

  const logs = logsResponse?.data || [];
  const totalPages = logsResponse?.totalPages || 1;
  const serverTotalCount = logsResponse?.total ?? 0;

  // Client-side text search over loaded records
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const q = searchTerm.toLowerCase();

    return logs.filter((log) => {
      const type = log.maintenanceType.toLowerCase();
      const desc = log.description.toLowerCase();
      const tech = log.performedBy.toLowerCase();
      const eq = equipmentMap.get(log.equipmentId);
      const eqName = (eq?.name || '').toLowerCase();
      const eqSerial = (eq?.serialNumber || '').toLowerCase();
      const branchName = (branchMap.get(log.branchId) || '').toLowerCase();

      return (
        type.includes(q) ||
        desc.includes(q) ||
        tech.includes(q) ||
        eqName.includes(q) ||
        eqSerial.includes(q) ||
        branchName.includes(q)
      );
    });
  }, [logs, searchTerm, equipmentMap, branchMap]);

  // Statistics calculated strictly over loaded records
  const loadedMetrics = useMemo(() => {
    let completedCount = 0;
    let scheduledCount = 0;
    let cancelledCount = 0;
    let totalLoadedCost = 0;

    for (const log of logs) {
      if (log.status === 'completed') completedCount++;
      else if (log.status === 'scheduled') scheduledCount++;
      else if (log.status === 'cancelled') cancelledCount++;
      totalLoadedCost += log.cost || 0;
    }

    return {
      loadedTotal: logs.length,
      completedCount,
      scheduledCount,
      cancelledCount,
      totalLoadedCost,
    };
  }, [logs]);

  const getStatusBadge = (status: MaintenanceLogStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-gym-600" />
            Maintenance & Repairs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track equipment work orders, technician dispatches, and servicing costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh maintenance records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Log Work Order
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1: Total Org Work Orders */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Orders
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoading ? '...' : serverTotalCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Org-wide</span>
          </div>
        </div>

        {/* Metric 2: Scheduled */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs bg-amber-50/10">
          <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Scheduled
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">
              {isLoading ? '...' : loadedMetrics.scheduledCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs bg-emerald-50/10">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {isLoading ? '...' : loadedMetrics.completedCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 4: Cancelled */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Ban className="w-3.5 h-3.5 text-gray-500" />
            Cancelled
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-700">
              {isLoading ? '...' : loadedMetrics.cancelledCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 5: Total Loaded Cost */}
        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            Cost (Loaded)
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              ${loadedMetrics.totalLoadedCost.toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Page {currentPage}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Client Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search type, notes, technician..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Equipment Asset Filter */}
          <div>
            <select
              value={equipmentFilter}
              onChange={(e) => {
                setEquipmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Equipment Assets</option>
              {equipmentList.map((eq) => (
                <option key={eq._id} value={eq._id}>
                  {eq.name} ({eq.serialNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Scope Notice */}
        {searchTerm.trim() && (
          <div className="text-[11px] text-gray-500 flex items-center justify-between px-1">
            <span>
              Searching within currently loaded page records: showing{' '}
              <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> loaded work orders
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-gym-600 hover:text-gym-700 underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gym-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Loading maintenance work orders...</p>
            <p className="text-xs text-gray-400 mt-1">Retrieving scheduled servicing and repair logs</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900">Failed to load maintenance records</p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.message || 'An error occurred while fetching maintenance work orders.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-gym-700 bg-gym-50 hover:bg-gym-100 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-800">No maintenance work orders found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {searchTerm || branchFilter !== 'all' || statusFilter !== 'all' || equipmentFilter !== 'all'
                ? 'No maintenance records match your current filter criteria. Try resetting filters.'
                : 'No maintenance logs have been recorded for your equipment yet. Click "Log Work Order" to create one.'}
            </p>
            {(searchTerm || branchFilter !== 'all' || statusFilter !== 'all' || equipmentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setBranchFilter('all');
                  setStatusFilter('all');
                  setEquipmentFilter('all');
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-1.5 text-xs font-semibold text-gym-700 bg-gym-50 hover:bg-gym-100 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Maintenance Task</th>
                  <th className="px-4 py-3">Equipment Asset</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Technician / Vendor</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Service Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredLogs.map((log) => {
                  const eq = equipmentMap.get(log.equipmentId);

                  return (
                    <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Maintenance Task */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{log.maintenanceType}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate" title={log.description}>
                          {log.description}
                        </div>
                      </td>

                      {/* Equipment Asset */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                          <Dumbbell className="w-3.5 h-3.5 text-gym-600 shrink-0" />
                          <span>{eq ? eq.name : log.equipmentId}</span>
                        </div>
                        {eq && (
                          <div className="font-mono text-[11px] text-gray-400">
                            S/N: {eq.serialNumber}
                          </div>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{branchMap.get(log.branchId) || log.branchId}</span>
                        </div>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-700">{log.performedBy}</span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-900">
                          ${(log.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Service Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs text-gray-700">
                          <div className="font-medium">{log.maintenanceDate}</div>
                          <div className="text-[11px] text-gray-400">Next: {log.nextMaintenanceDate}</div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/maintenance/${log._id}`}
                            className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                            title="View work order details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setSelectedLogForEdit(log)}
                            className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                            title="Edit work order specifications"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedLogForStatus(log)}
                            className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                            title="Change work order status"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingLog(log)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete work order permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total matching work orders in organization: <strong>{serverTotalCount}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <EditMaintenanceModal
        isOpen={!!selectedLogForEdit}
        onClose={() => setSelectedLogForEdit(null)}
        log={selectedLogForEdit}
        equipmentName={
          selectedLogForEdit
            ? equipmentMap.get(selectedLogForEdit.equipmentId)?.name
            : undefined
        }
        branchName={
          selectedLogForEdit
            ? branchMap.get(selectedLogForEdit.branchId)
            : undefined
        }
      />

      {/* Change Status Modal */}
      <MaintenanceStatusModal
        isOpen={!!selectedLogForStatus}
        onClose={() => setSelectedLogForStatus(null)}
        log={selectedLogForStatus}
        equipmentName={
          selectedLogForStatus
            ? equipmentMap.get(selectedLogForStatus.equipmentId)?.name
            : undefined
        }
      />

      <ConfirmDeleteModal
        isOpen={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        onConfirm={async () => {
          if (deletingLog) {
            await deleteLogMutation.mutateAsync(deletingLog._id);
            setDeletingLog(null);
          }
        }}
        title="Delete Maintenance Work Order"
        itemName={deletingLog ? `${deletingLog.maintenanceType}: ${deletingLog.description}` : ''}
        isLoading={deleteLogMutation.isPending}
      />
    </div>
  );
};
