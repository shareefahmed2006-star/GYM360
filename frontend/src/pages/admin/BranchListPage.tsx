import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranchStatus,
  useDeleteBranch,
} from '../../hooks/useBranches';
import { BranchDocument, BranchStatus } from '../../types/branch.types';
import { BranchStatusConfirmModal } from '../../components/branch/BranchStatusConfirmModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  GitBranch,
  Plus,
  Search,
  Users,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Power,
  RefreshCw,
  X,
  Trash2,
} from 'lucide-react';

export const BranchListPage: React.FC = () => {
  const { data: branches = [], isLoading, isError, error, refetch, isFetching } =
    useBranches();
  const createBranchMutation = useCreateBranch();
  const updateStatusMutation = useUpdateBranchStatus();
  const deleteBranchMutation = useDeleteBranch();

  // Search and status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Deletion modal state
  const [deletingBranch, setDeletingBranch] = useState<BranchDocument | null>(null);

  // Status toggle confirmation modal state
  const [statusModalBranch, setStatusModalBranch] = useState<{
    id: string;
    name: string;
    targetStatus: BranchStatus;
  } | null>(null);

  // Create branch modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    capacity: '',
    openingTime: '06:00',
    closingTime: '22:00',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Filtered branches
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address.street.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || branch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = branches.filter((b) => b.status === 'active').length;
  const inactiveCount = branches.filter((b) => b.status === 'inactive').length;

  const handleStatusToggleRequest = (branch: BranchDocument) => {
    const targetStatus: BranchStatus =
      branch.status === 'active' ? 'inactive' : 'active';
    setStatusModalBranch({
      id: branch._id,
      name: branch.name,
      targetStatus,
    });
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusModalBranch) return;
    try {
      await updateStatusMutation.mutateAsync({
        branchId: statusModalBranch.id,
        status: statusModalBranch.targetStatus,
      });
      setStatusModalBranch(null);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation matching backend rules
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedStreet = formData.street.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();
    const trimmedPostal = formData.postalCode.trim();

    if (
      !trimmedName ||
      !trimmedPhone ||
      !trimmedStreet ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostal
    ) {
      setFormError('All name, phone, and complete address fields are required.');
      return;
    }

    // Capacity validation: finite integer > 0 and <= 2147483647
    const numericCapacity = Number(formData.capacity);
    if (
      !Number.isInteger(numericCapacity) ||
      numericCapacity <= 0 ||
      numericCapacity > 2147483647
    ) {
      setFormError('Branch capacity must be a positive whole number greater than 0.');
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        name: trimmedName,
        phone: trimmedPhone,
        capacity: numericCapacity,
        openingTime: formData.openingTime.trim(),
        closingTime: formData.closingTime.trim(),
        address: {
          street: trimmedStreet,
          city: trimmedCity,
          state: trimmedState,
          postalCode: trimmedPostal,
        },
      });

      // Reset and close
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        capacity: '',
        openingTime: '06:00',
        closingTime: '22:00',
        street: '',
        city: '',
        state: '',
        postalCode: '',
      });
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create branch.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <GitBranch className="w-4 h-4" />
            Facility Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Branch Locations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your organization's gym facilities, capacity quotas, and operating hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh branches list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Branch
          </button>
        </div>
      </div>

      {/* 2. Filters & Status Pill Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Branches ({branches.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-gray-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches by name, city..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gym-500"
          />
        </div>
      </div>

      {/* 3. Branch List Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs h-60 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-center justify-between">
          <div>
            <p className="font-bold">Failed to load branch facilities.</p>
            <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'Please check your connection.'}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No branches found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No branch facilities match your search query.'
              : 'No branch locations exist for this organization yet. Click Add New Branch above to create one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => {
            const isActive = branch.status === 'active';

            return (
              <div
                key={branch._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-extrabold text-base text-gray-900 tracking-tight leading-snug">
                      {branch.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {branch.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 mb-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {branch.address.street}, {branch.address.city} ({branch.address.postalCode})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {branch.openingTime} — {branch.closingTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        Max Capacity: <strong className="text-gray-900 font-semibold">{branch.capacity}</strong> members
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusToggleRequest(branch)}
                    title={isActive ? 'Deactivate branch' : 'Reactivate branch'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/branches/${branch._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gym-700 hover:text-gym-800 transition-colors"
                    >
                      <span>View & Edit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDeletingBranch(branch)}
                      title="Delete branch permanently"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Status Confirm Modal */}
      <BranchStatusConfirmModal
        isOpen={!!statusModalBranch}
        branchName={statusModalBranch?.name || ''}
        targetStatus={statusModalBranch?.targetStatus || 'active'}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setStatusModalBranch(null)}
      />

      {/* 5. Create Branch Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-900">Add New Branch Facility</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4">
                <ErrorAlert message={formError} onClose={() => setFormError(null)} />
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Baner Center"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Capacity (Int32) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="2147483647"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Opening Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    placeholder="06:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Closing Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    placeholder="22:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Main Road, Block A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="411038"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending}
                  className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {createBranchMutation.isPending ? 'Creating Branch...' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingBranch}
        onClose={() => setDeletingBranch(null)}
        onConfirm={async () => {
          if (deletingBranch) {
            await deleteBranchMutation.mutateAsync(deletingBranch._id);
            setDeletingBranch(null);
          }
        }}
        title="Delete Branch"
        itemName={deletingBranch ? deletingBranch.name : ''}
        isLoading={deleteBranchMutation.isPending}
      />
    </div>
  );
};
