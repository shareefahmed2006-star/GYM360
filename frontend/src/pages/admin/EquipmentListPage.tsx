import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Wrench,
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useEquipmentList, useDeleteEquipment } from '../../hooks/useEquipment';
import { useBranches } from '../../hooks/useBranches';
import { AddEquipmentModal } from '../../components/equipment/AddEquipmentModal';
import { EditEquipmentModal } from '../../components/equipment/EditEquipmentModal';
import { EquipmentStatusModal } from '../../components/equipment/EquipmentStatusModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EquipmentDocument, EquipmentStatus } from '../../types/equipment.types';

export const EquipmentListPage: React.FC = () => {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 50;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingEquipment, setDeletingEquipment] = useState<EquipmentDocument | null>(null);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] =
    useState<EquipmentDocument | null>(null);
  const [selectedEquipmentForStatus, setSelectedEquipmentForStatus] =
    useState<EquipmentDocument | null>(null);

  const deleteEquipmentMutation = useDeleteEquipment();

  // Server-supported filters
  const apiFilters = useMemo(() => {
    const filters: {
      branchId?: string;
      status?: string;
      category?: string;
      page?: number;
      limit?: number;
    } = {
      page: currentPage,
      limit,
    };
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    return filters;
  }, [branchFilter, statusFilter, categoryFilter, currentPage, limit]);

  const {
    data: equipmentResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEquipmentList(apiFilters);

  const { data: branches = [] } = useBranches();

  // Branch mapping for human-readable labels
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  const equipmentList = equipmentResponse?.data || [];
  const totalPages = equipmentResponse?.totalPages || 1;
  const serverTotalCount = equipmentResponse?.total ?? 0;

  // Extract distinct categories from loaded records to augment filter options
  const allCategories = useMemo(() => {
    const defaults = ['Cardio', 'Strength', 'Free Weights', 'Functional Training', 'Recovery & Wellness'];
    const set = new Set<string>(defaults);
    equipmentList.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [equipmentList]);

  // Client-side text search over the currently loaded page
  const filteredEquipment = useMemo(() => {
    if (!searchTerm.trim()) return equipmentList;
    const q = searchTerm.toLowerCase();

    return equipmentList.filter((item) => {
      const name = item.name.toLowerCase();
      const brand = item.brand.toLowerCase();
      const model = item.model.toLowerCase();
      const serial = item.serialNumber.toLowerCase();
      const cat = item.category.toLowerCase();
      const branchName = (branchMap.get(item.branchId) || '').toLowerCase();

      return (
        name.includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        serial.includes(q) ||
        cat.includes(q) ||
        branchName.includes(q)
      );
    });
  }, [equipmentList, searchTerm, branchMap]);

  // Statistics calculated strictly over loaded records
  const loadedMetrics = useMemo(() => {
    let operationalCount = 0;
    let underMaintenanceCount = 0;
    let outOfServiceCount = 0;

    for (const item of equipmentList) {
      if (item.status === 'operational') operationalCount++;
      else if (item.status === 'under_maintenance') underMaintenanceCount++;
      else if (item.status === 'out_of_service') outOfServiceCount++;
    }

    const loadedTotal = equipmentList.length;
    const operationalRate =
      loadedTotal > 0 ? Math.round((operationalCount / loadedTotal) * 100) : 0;

    return {
      loadedTotal,
      operationalCount,
      underMaintenanceCount,
      outOfServiceCount,
      operationalRate,
    };
  }, [equipmentList]);

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Operational
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3" />
            Under Maintenance
          </span>
        );
      case 'out_of_service':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3" />
            Out of Service
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const getMaintenanceWarning = (nextDate: string) => {
    if (!nextDate) return null;
    if (nextDate < today) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Overdue
        </span>
      );
    }
    const daysDiff = Math.ceil(
      (new Date(nextDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24)
    );
    if (daysDiff <= 14) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
          <Clock className="w-3 h-3 shrink-0" />
          In {daysDiff}d
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-gym-600" />
            Equipment Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage fitness machinery, operational availability, and maintenance cycles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh equipment records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Register Equipment
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1: Total Org Assets */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Assets
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoading ? '...' : serverTotalCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Org-wide</span>
          </div>
        </div>

        {/* Metric 2: Operational */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs bg-emerald-50/10">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Operational
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {isLoading ? '...' : loadedMetrics.operationalCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 3: Under Maintenance */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs bg-amber-50/10">
          <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            Maintenance
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">
              {isLoading ? '...' : loadedMetrics.underMaintenanceCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 4: Out of Service */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs bg-rose-50/10">
          <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            Out of Service
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-700">
              {isLoading ? '...' : loadedMetrics.outOfServiceCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Loaded</span>
          </div>
        </div>

        {/* Metric 5: Operational Rate */}
        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Operational Rate
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoading ? '...' : `${loadedMetrics.operationalRate}%`}
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
              placeholder="Search loaded page..."
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

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>

        {/* Search Scope Clarification Notice */}
        {searchTerm.trim() && (
          <div className="text-[11px] text-gray-500 flex items-center justify-between px-1">
            <span>
              Searching within currently loaded page records: showing{' '}
              <strong>{filteredEquipment.length}</strong> of{' '}
              <strong>{equipmentList.length}</strong> loaded assets
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
            <p className="text-sm font-medium text-gray-700">Loading equipment inventory...</p>
            <p className="text-xs text-gray-400 mt-1">Retrieving registered fitness assets</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900">Failed to load equipment</p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.message || 'An error occurred while fetching equipment inventory.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-gym-700 bg-gym-50 hover:bg-gym-100 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="p-12 text-center">
            <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-800">No equipment found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {searchTerm || branchFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No equipment assets match your current filter criteria. Try resetting filters.'
                : 'No equipment has been registered in your organization yet. Click "Register Equipment" to add your first asset.'}
            </p>
            {(searchTerm || branchFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setBranchFilter('all');
                  setStatusFilter('all');
                  setCategoryFilter('all');
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
                  <th className="px-5 py-3">Equipment & Model</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Maintenance Schedule</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEquipment.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name & Model */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.brand} • {item.model}
                      </div>
                    </td>

                    {/* Serial Number */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {item.serialNumber}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{branchMap.get(item.branchId) || item.branchId}</span>
                      </div>
                    </td>

                    {/* Operational Status */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Maintenance Schedule */}
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-gray-700 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-[11px]">Next:</span>
                          <span className="font-medium">{item.nextMaintenanceDate}</span>
                          {getMaintenanceWarning(item.nextMaintenanceDate)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Last: {item.lastMaintenanceDate}
                        </div>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/equipment/${item._id}`}
                          className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          title="View asset details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setSelectedEquipmentForEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          title="Edit specifications"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedEquipmentForStatus(item)}
                          className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          title="Change operational status"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEquipment(item)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete equipment permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total matching records in organization: <strong>{serverTotalCount}</strong>
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

      {/* Add Equipment Modal */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Equipment Modal */}
      <EditEquipmentModal
        isOpen={!!selectedEquipmentForEdit}
        onClose={() => setSelectedEquipmentForEdit(null)}
        equipment={selectedEquipmentForEdit}
        branchName={
          selectedEquipmentForEdit
            ? branchMap.get(selectedEquipmentForEdit.branchId)
            : undefined
        }
      />

      {/* Change Status Modal */}
      <EquipmentStatusModal
        isOpen={!!selectedEquipmentForStatus}
        onClose={() => setSelectedEquipmentForStatus(null)}
        equipment={selectedEquipmentForStatus}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingEquipment}
        onClose={() => setDeletingEquipment(null)}
        onConfirm={async () => {
          if (deletingEquipment) {
            await deleteEquipmentMutation.mutateAsync(deletingEquipment._id);
            setDeletingEquipment(null);
          }
        }}
        title="Delete Equipment Asset"
        itemName={deletingEquipment ? `${deletingEquipment.name} (${deletingEquipment.serialNumber})` : ''}
        isLoading={deleteEquipmentMutation.isPending}
      />
    </div>
  );
};
