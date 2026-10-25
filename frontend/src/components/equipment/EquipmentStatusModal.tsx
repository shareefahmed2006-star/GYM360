import React, { useState } from 'react';
import { X, AlertCircle, ShieldAlert, CheckCircle2, Wrench, Ban } from 'lucide-react';
import { useUpdateEquipmentStatus } from '../../hooks/useEquipment';
import { EquipmentDocument, EquipmentStatus } from '../../types/equipment.types';

interface EquipmentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentDocument | null;
}

export const EquipmentStatusModal: React.FC<EquipmentStatusModalProps> = ({
  isOpen,
  onClose,
  equipment,
}) => {
  const updateStatusMutation = useUpdateEquipmentStatus();
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus>(
    equipment?.status || 'operational'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state when opened
  React.useEffect(() => {
    if (isOpen && equipment) {
      setSelectedStatus(equipment.status);
      setErrorMsg(null);
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (selectedStatus === equipment.status) {
      onClose();
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        equipmentId: equipment._id,
        dto: { status: selectedStatus },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update equipment status.');
    }
  };

  const statusOptions: {
    status: EquipmentStatus;
    title: string;
    description: string;
    icon: React.ElementType;
    activeBorder: string;
    activeBg: string;
    textColor: string;
  }[] = [
    {
      status: 'operational',
      title: 'Operational (Ready for use)',
      description:
        'The equipment is fully functional, inspected, and active on the gym floor for members and staff.',
      icon: CheckCircle2,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeBg: 'bg-emerald-50/50',
      textColor: 'text-emerald-700',
    },
    {
      status: 'under_maintenance',
      title: 'Under Maintenance (Temporarily offline)',
      description:
        'The equipment is undergoing routine servicing, mechanical diagnosis, or awaiting replacement parts. Members should not access this machine.',
      icon: Wrench,
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      activeBg: 'bg-amber-50/50',
      textColor: 'text-amber-700',
    },
    {
      status: 'out_of_service',
      title: 'Out of Service (Decommissioned / Broken)',
      description:
        'The equipment has failed critical safety criteria or is decommissioned. It cannot be used until thoroughly overhauled or replaced.',
      icon: Ban,
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      activeBg: 'bg-rose-50/50',
      textColor: 'text-rose-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Change Equipment Status</h2>
              <p className="text-xs text-gray-500">
                Update floor operational availability for this asset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Asset Context */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">{equipment.name}</span>
              <span className="text-gray-500 ml-2">({equipment.brand} - {equipment.model})</span>
            </div>
            <span className="font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
              {equipment.serialNumber}
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Select Operational State
            </label>

            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedStatus === opt.status;

              return (
                <div
                  key={opt.status}
                  onClick={() => setSelectedStatus(opt.status)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? `${opt.activeBorder} ${opt.activeBg}`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? opt.textColor : 'text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">{opt.title}</h4>
                        <input
                          type="radio"
                          name="equipment-status"
                          checked={isSelected}
                          onChange={() => setSelectedStatus(opt.status)}
                          className="h-4 w-4 text-gym-600 focus:ring-gym-500 border-gray-300"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedStatus === 'out_of_service' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <strong>Operational Caution:</strong> Marking this asset as Out of Service will
              notify staff to physically quarantine or tag the equipment.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Status Change'}
          </button>
        </div>
      </div>
    </div>
  );
};
