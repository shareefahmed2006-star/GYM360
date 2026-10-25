import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  Power,
  ShieldCheck,
  Building2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useTrainers, useDeleteTrainer } from '../../hooks/useTrainers';
import { useBranches } from '../../hooks/useBranches';
import { AddTrainerModal } from '../../components/trainer/AddTrainerModal';
import { EditTrainerModal } from '../../components/trainer/EditTrainerModal';
import { TrainerStatusConfirmModal } from '../../components/trainer/TrainerStatusConfirmModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { TrainerDocument, TrainerStatus } from '../../types/trainer.types';

export const TrainerListPage: React.FC = () => {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Assemble server-supported filters
  const apiFilters = useMemo(() => {
    const filters: {
      branchId?: string;
      status?: TrainerStatus;
      specialization?: string;
    } = {};
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (statusFilter !== 'all') filters.status = statusFilter as TrainerStatus;
    if (specializationFilter !== 'all') filters.specialization = specializationFilter;
    return filters;
  }, [branchFilter, statusFilter, specializationFilter]);

  const {
    data: trainers = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTrainers(apiFilters);

  const { data: branches = [] } = useBranches();

  // Branch mapping for human-readable labels
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  // Extract distinct specializations from loaded trainers for filter dropdown
  const allSpecializations = useMemo(() => {
    const set = new Set<string>();
    trainers.forEach((t) => {
      if (Array.isArray(t.specialization)) {
        t.specialization.forEach((s) => set.add(s));
      }
    });
    return Array.from(set).sort();
  }, [trainers]);

  // Client-side search within loaded records
  const filteredTrainers = useMemo(() => {
    if (!searchTerm.trim()) return trainers;
    const query = searchTerm.toLowerCase();

    return trainers.filter((t) => {
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const email = t.email.toLowerCase();
      const phone = t.phone.toLowerCase();
      const branchName = branchMap.get(t.branchId)?.toLowerCase() || '';
      const specs = (t.specialization || []).join(' ').toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        branchName.includes(query) ||
        specs.includes(query)
      );
    });
  }, [trainers, searchTerm, branchMap]);

  // Statistics calculated strictly over loaded records
  const loadedMetrics = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;

    for (const t of trainers) {
      if (t.status === 'active') activeCount++;
      else inactiveCount++;
    }

    return {
      loadedTotal: trainers.length,
      activeCount,
      inactiveCount,
      specializationsCount: allSpecializations.length,
    };
  }, [trainers, allSpecializations]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTrainer, setDeletingTrainer] = useState<TrainerDocument | null>(null);
  const [selectedTrainerForEdit, setSelectedTrainerForEdit] =
    useState<TrainerDocument | null>(null);
  const [selectedTrainerForStatus, setSelectedTrainerForStatus] =
    useState<TrainerDocument | null>(null);

  const deleteTrainerMutation = useDeleteTrainer();

  const getStatusBadge = (status: TrainerStatus) => {
    return status === 'active' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-gym-600" />
            Trainer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage fitness coaches, branch assignments, credentials, and coaching profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh trainers"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Trainer
          </button>
        </div>
      </div>

      {/* Metrics Row (Strictly labeled as Loaded Records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Total Coaches</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? '...' : loadedMetrics.loadedTotal}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Registered in organization
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-emerald-700">
            <span>Active Trainers</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {isLoading ? '...' : loadedMetrics.activeCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Eligible for sessions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500">
            <span>Inactive Trainers</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {isLoading ? '...' : loadedMetrics.inactiveCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Deactivated profiles</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gym-700">
            <span>Specializations</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">
              (Loaded)
            </span>
          </div>
          <p className="text-2xl font-bold text-gym-700 mt-1">
            {isLoading ? '...' : loadedMetrics.specializationsCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Distinct fitness disciplines</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within loaded trainers by name, email, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700 max-w-[170px]"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Specialization Filter */}
          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white text-gray-700 max-w-[170px]"
          >
            <option value="all">All Disciplines</option>
            {allSpecializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading trainer registry...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Failed to load trainers
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {(error as any)?.message ||
                'An error occurred while fetching trainer profiles.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400 mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No trainers found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm ||
              branchFilter !== 'all' ||
              statusFilter !== 'all' ||
              specializationFilter !== 'all'
                ? 'Try adjusting your search criteria or active filters.'
                : 'Get started by registering a certified fitness coach.'}
            </p>
            {!(
              searchTerm ||
              branchFilter !== 'all' ||
              statusFilter !== 'all' ||
              specializationFilter !== 'all'
            ) && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Trainer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Trainer Profile</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Specializations</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTrainers.map((trainer) => {
                  const branchName = branchMap.get(trainer.branchId);

                  return (
                    <tr
                      key={trainer._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/trainers/${trainer._id}`}
                          className="font-semibold text-gym-600 hover:text-gym-700 hover:underline flex items-center gap-1.5"
                        >
                          <span>
                            {trainer.firstName} {trainer.lastName}
                          </span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {trainer.email} • {trainer.phone}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        <Link
                          to={`/admin/branches/${trainer.branchId}`}
                          className="hover:text-gym-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span>{branchName || trainer.branchId}</span>
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(trainer.specialization || []).map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-700">
                        <span className="font-medium">
                          {trainer.experienceYears} year
                          {trainer.experienceYears === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(trainer.status)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/trainers/${trainer._id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setSelectedTrainerForEdit(trainer)}
                            className="p-1.5 rounded-lg text-gym-600 hover:bg-gym-50 transition-colors"
                            title="Edit Trainer Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedTrainerForStatus(trainer)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              trainer.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              trainer.status === 'active'
                                ? 'Deactivate Trainer'
                                : 'Activate Trainer'
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingTrainer(trainer)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Trainer permanently"
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
      </div>

      {/* Add Trainer Modal */}
      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Trainer Modal */}
      <EditTrainerModal
        isOpen={!!selectedTrainerForEdit}
        onClose={() => setSelectedTrainerForEdit(null)}
        trainer={selectedTrainerForEdit}
      />

      {/* Status Confirm Modal */}
      <TrainerStatusConfirmModal
        isOpen={!!selectedTrainerForStatus}
        onClose={() => setSelectedTrainerForStatus(null)}
        trainer={selectedTrainerForStatus}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingTrainer}
        onClose={() => setDeletingTrainer(null)}
        onConfirm={async () => {
          if (deletingTrainer) {
            await deleteTrainerMutation.mutateAsync(deletingTrainer._id);
            setDeletingTrainer(null);
          }
        }}
        title="Delete Trainer Profile"
        itemName={deletingTrainer ? `${deletingTrainer.firstName} ${deletingTrainer.lastName} (${deletingTrainer.email})` : ''}
        isLoading={deleteTrainerMutation.isPending}
      />
    </div>
  );
};
