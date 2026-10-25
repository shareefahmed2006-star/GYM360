import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  Edit,
  Power,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useTrainer, useTrainerAvailability } from '../../hooks/useTrainers';
import { useBranch } from '../../hooks/useBranches';
import { EditTrainerModal } from '../../components/trainer/EditTrainerModal';
import { TrainerStatusConfirmModal } from '../../components/trainer/TrainerStatusConfirmModal';

export const TrainerDetailPage: React.FC = () => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const navigate = useNavigate();

  const {
    data: trainer,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTrainer(trainerId);

  // Associated Branch details
  const { data: branch } = useBranch(trainer?.branchId);

  // Optional Read-Only Weekly Availability
  const { data: availabilitySlots = [], isLoading: isLoadingAvailability } =
    useTrainerAvailability(trainerId);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading trainer profile...</p>
      </div>
    );
  }

  if (isError || !trainer) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Trainer Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested trainer profile could not be found or you do not have permission to view it.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/trainers')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Directory
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/trainers"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trainers
        </Link>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          title="Refresh trainer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {trainer.firstName} {trainer.lastName}
            </h1>
            {getStatusBadge(trainer.status)}
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Trainer ID: {trainer._id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gym-50 hover:bg-gym-100 text-gym-700 border border-gym-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              trainer.status === 'active'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            <Power className="w-4 h-4" />
            {trainer.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Grid: Profile Details & Branch Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Professional Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-semibold text-base">
            <UserCheck className="w-5 h-5 text-gym-600" />
            <h3>Contact & Professional Details</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Address
              </span>
              <span className="font-mono text-gray-900 font-medium">
                {trainer.email}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                Phone Number
              </span>
              <span className="text-gray-800 font-medium">{trainer.phone}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-gray-400" />
                Experience
              </span>
              <span className="text-gray-900 font-semibold">
                {trainer.experienceYears} year
                {trainer.experienceYears === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
              Specializations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(trainer.specialization || []).map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gym-50 text-gym-700 border border-gym-100"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
              Biography
            </span>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
              {trainer.bio || 'No biographical information provided.'}
            </p>
          </div>
        </div>

        {/* Assigned Branch Card & Read-Only Schedule Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
                <Building2 className="w-5 h-5 text-gym-600" />
                <h3>Assigned Branch</h3>
              </div>
              <Link
                to={`/admin/branches/${trainer.branchId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-gym-600 hover:text-gym-700 hover:underline"
              >
                <span>View Branch</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Branch Name</span>
                <span className="font-semibold text-gray-900">
                  {branch?.name || '...'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Location</span>
                <span className="text-gray-700">
                  {branch
                    ? `${branch.address.city}, ${branch.address.state}`
                    : '...'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Branch Status</span>
                <span className="capitalize font-medium text-gray-800">
                  {branch?.status || '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Read-Only Weekly Availability */}
          <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                <Calendar className="w-4 h-4 text-gym-600" />
                <h4>Configured Availability Slots (Read-Only)</h4>
              </div>
              <span className="text-xs text-gray-400">
                {availabilitySlots.length} slot
                {availabilitySlots.length === 1 ? '' : 's'}
              </span>
            </div>

            {isLoadingAvailability ? (
              <p className="text-xs text-gray-400 py-2">Loading schedule...</p>
            ) : availabilitySlots.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">
                No availability slots have been configured for this trainer.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availabilitySlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs border border-gray-100"
                  >
                    <span className="font-semibold text-gray-800">
                      {slot.dayOfWeek}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 font-mono">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        slot.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Trainer Modal */}
      <EditTrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trainer={trainer}
      />

      {/* Status Confirm Modal */}
      <TrainerStatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        trainer={trainer}
      />
    </div>
  );
};
