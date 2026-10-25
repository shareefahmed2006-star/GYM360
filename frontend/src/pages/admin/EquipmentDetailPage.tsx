import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Ban,
  Tag,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useEquipment } from '../../hooks/useEquipment';
import { useBranch } from '../../hooks/useBranches';
import { EditEquipmentModal } from '../../components/equipment/EditEquipmentModal';
import { EquipmentStatusModal } from '../../components/equipment/EquipmentStatusModal';
import { EquipmentStatus } from '../../types/equipment.types';

export const EquipmentDetailPage: React.FC = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();

  const {
    data: equipment,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEquipment(equipmentId);

  // Associated Branch details
  const { data: branch } = useBranch(equipment?.branchId);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading equipment specifications...</p>
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Equipment Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested equipment asset could not be found or you do not have permission to view it.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/equipment')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Equipment Directory
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

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Operational
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-4 h-4 text-amber-600" />
            Under Maintenance
          </span>
        );
      case 'out_of_service':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-4 h-4 text-rose-600" />
            Out of Service
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

  const getMaintenanceDaysInfo = (nextDate: string) => {
    if (!nextDate) return null;
    const diffMs = new Date(nextDate).getTime() - new Date(today).getTime();
    const days = Math.ceil(diffMs / (1000 * 3600 * 24));

    if (days < 0) {
      return {
        label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertTriangle,
      };
    }
    if (days === 0) {
      return {
        label: 'Scheduled for maintenance today',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
    }
    if (days <= 14) {
      return {
        label: `Due soon (in ${days} day${days === 1 ? '' : 's'})`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
    }
    return {
      label: `Inspection scheduled in ${days} days`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    };
  };

  const maintenanceSchedule = getMaintenanceDaysInfo(equipment.nextMaintenanceDate);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/admin/equipment"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gym-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Equipment Inventory
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gym-50 text-gym-700 rounded-xl border border-gym-100 shrink-0">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
                {getStatusBadge(equipment.status)}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {equipment.category}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {equipment.brand} • Model {equipment.model}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh equipment"
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

      {/* Grid: Specifications & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specifications Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Tag className="w-4 h-4 text-gym-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Asset Specifications
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Category
              </span>
              <p className="font-medium text-gray-900 mt-0.5">{equipment.category}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Brand / Manufacturer
              </span>
              <p className="font-medium text-gray-900 mt-0.5">{equipment.brand}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Model Number
              </span>
              <p className="font-medium text-gray-900 mt-0.5">{equipment.model}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Serial Number
              </span>
              <p className="font-mono text-sm text-gray-800 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 mt-0.5 inline-block">
                {equipment.serialNumber}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Assigned Branch Location
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-gym-600" />
                <span className="font-semibold text-gray-900">
                  {branch?.name || equipment.branchId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance & Lifecycle Timeline Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Calendar className="w-4 h-4 text-gym-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Lifecycle & Maintenance
            </h2>
          </div>

          {/* Maintenance Status Banner */}
          {maintenanceSchedule && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-semibold ${maintenanceSchedule.badgeClass}`}
            >
              <maintenanceSchedule.icon className="w-4 h-4 shrink-0" />
              <span>{maintenanceSchedule.label}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Purchase Date
              </span>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {equipment.purchaseDate}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Last Serviced
              </span>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-gray-400" />
                {equipment.lastMaintenanceDate}
              </p>
            </div>

            <div className="col-span-full pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Next Scheduled Inspection
              </span>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gym-600" />
                {equipment.nextMaintenanceDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Consequence & M25 Context Banner */}
      <div className="bg-blue-50/70 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold">Maintenance Logging & Work Orders Notice</p>
          <p className="leading-relaxed text-blue-800">
            Detailed maintenance logs, work order dispatches, technician notes, and repair expenses
            for this equipment asset are managed centrally under{' '}
            <strong className="underline">Maintenance & Repairs (Milestone 25)</strong>.
          </p>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      <EditEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        equipment={equipment}
        branchName={branch?.name}
      />

      {/* Change Status Modal */}
      <EquipmentStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        equipment={equipment}
      />
    </div>
  );
};
