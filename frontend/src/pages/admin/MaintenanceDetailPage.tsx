import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Ban,
  DollarSign,
  Dumbbell,
  Tag,
  ExternalLink,
  User,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useMaintenanceLog } from '../../hooks/useMaintenance';
import { useBranch } from '../../hooks/useBranches';
import { useEquipment } from '../../hooks/useEquipment';
import { EditMaintenanceModal } from '../../components/maintenance/EditMaintenanceModal';
import { MaintenanceStatusModal } from '../../components/maintenance/MaintenanceStatusModal';
import { MaintenanceLogStatus } from '../../types/maintenance.types';

export const MaintenanceDetailPage: React.FC = () => {
  const { maintenanceLogId } = useParams<{ maintenanceLogId: string }>();
  const navigate = useNavigate();

  const {
    data: log,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMaintenanceLog(maintenanceLogId);

  // Associated Branch details
  const { data: branch } = useBranch(log?.branchId);

  // Associated Equipment details
  const { data: equipment } = useEquipment(log?.equipmentId);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading maintenance work order...</p>
      </div>
    );
  }

  if (isError || !log) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Work Order Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested maintenance record could not be found or you do not have permission to view it.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/maintenance')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Maintenance Directory
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

  const getStatusBadge = (status: MaintenanceLogStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Completed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Ban className="w-4 h-4 text-gray-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const getNextInspectionAlert = (nextDate: string) => {
    if (!nextDate) return null;
    const diffMs = new Date(nextDate).getTime() - new Date(today).getTime();
    const days = Math.ceil(diffMs / (1000 * 3600 * 24));

    if (days < 0) {
      return {
        label: `Next inspection overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertTriangle,
      };
    }
    if (days === 0) {
      return {
        label: 'Next inspection scheduled for today',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
    }
    if (days <= 14) {
      return {
        label: `Next inspection due in ${days} day${days === 1 ? '' : 's'}`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
    }
    return {
      label: `Next inspection in ${days} days`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    };
  };

  const nextInspectionAlert = getNextInspectionAlert(log.nextMaintenanceDate);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/admin/maintenance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gym-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Maintenance & Repairs
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gym-50 text-gym-700 rounded-xl border border-gym-100 shrink-0">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{log.maintenanceType}</h1>
                {getStatusBadge(log.status)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Serviced by <strong className="text-gray-700">{log.performedBy}</strong> on{' '}
                <strong className="text-gray-700">{log.maintenanceDate}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh record"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
            >
              <Edit className="w-4 h-4 text-gray-500" />
              Edit Details
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Change Status
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Task Specifications & Linked Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Order Details Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Tag className="w-4 h-4 text-gym-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Work Order Specifications
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Maintenance Type
              </span>
              <p className="font-medium text-gray-900 mt-0.5">{log.maintenanceType}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Service Cost
              </span>
              <p className="font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-400" />
                {(log.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Technician / Provider
              </span>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                {log.performedBy}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Service Date
              </span>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {log.maintenanceDate}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Work Scope & Findings Description
              </span>
              <p className="text-sm text-gray-800 mt-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                {log.description}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Next Inspection Schedule
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                  <Clock className="w-4 h-4 text-gym-600" />
                  {log.nextMaintenanceDate}
                </div>
                {nextInspectionAlert && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${nextInspectionAlert.badgeClass}`}
                  >
                    <nextInspectionAlert.icon className="w-3.5 h-3.5" />
                    {nextInspectionAlert.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Equipment & Facility Location Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-gym-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Associated Equipment Asset
              </h2>
            </div>
            {equipment && (
              <Link
                to={`/admin/equipment/${equipment._id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gym-600 hover:text-gym-700"
              >
                <span>View Asset Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {equipment ? (
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{equipment.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {equipment.brand} • Model {equipment.model}
                  </p>
                </div>
                <span className="font-mono text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {equipment.serialNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Category
                  </span>
                  <p className="font-medium text-gray-900 mt-0.5">{equipment.category}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Equipment Status
                  </span>
                  <p className="font-medium text-gray-900 mt-0.5 capitalize">
                    {equipment.status.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Assigned Branch Location
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-gym-600" />
                  <span className="font-semibold text-gray-900">
                    {branch?.name || log.branchId}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
              <div>Equipment ID: <span className="font-mono">{log.equipmentId}</span></div>
              <div>Branch ID: <span className="font-mono">{log.branchId}</span></div>
            </div>
          )}

          {/* Decoupling Operational Advisory */}
          <div className="pt-2 border-t border-gray-100">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <strong>Equipment Status Decoupling:</strong> Maintenance work orders and equipment
                floor availability are tracked independently. If this machine needs to be marked
                operational or out of service, please visit the{' '}
                {equipment ? (
                  <Link
                    to={`/admin/equipment/${equipment._id}`}
                    className="font-bold underline hover:text-blue-950"
                  >
                    equipment details page
                  </Link>
                ) : (
                  'equipment inventory'
                )}{' '}
                to adjust its status badge.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditMaintenanceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        log={log}
        equipmentName={equipment?.name}
        branchName={branch?.name}
      />

      {/* Status Modal */}
      <MaintenanceStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        log={log}
        equipmentName={equipment?.name}
      />
    </div>
  );
};
