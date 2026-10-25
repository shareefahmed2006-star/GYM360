import React, { useState } from 'react';
import { X, AlertCircle, Wrench, CheckCircle2, Clock, Ban, Info } from 'lucide-react';
import { useUpdateMaintenanceLogStatus } from '../../hooks/useMaintenance';
import { MaintenanceLogDocument, MaintenanceLogStatus } from '../../types/maintenance.types';

interface MaintenanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MaintenanceLogDocument | null;
  equipmentName?: string;
}

export const MaintenanceStatusModal: React.FC<MaintenanceStatusModalProps> = ({
  isOpen,
  onClose,
  log,
  equipmentName,
}) => {
  const updateStatusMutation = useUpdateMaintenanceLogStatus();
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceLogStatus>(
    log?.status || 'scheduled'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && log) {
      setSelectedStatus(log.status);
      setErrorMsg(null);
    }
  }, [isOpen, log]);

  if (!isOpen || !log) return null;

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (selectedStatus === log.status) {
      onClose();
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        logId: log._id,
        dto: { status: selectedStatus },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update maintenance status.');
    }
  };

  const statusOptions: {
    status: MaintenanceLogStatus;
    title: string;
    description: string;
    icon: React.ElementType;
    activeBorder: string;
    activeBg: string;
    textColor: string;
  }[] = [
    {
      status: 'scheduled',
      title: 'Scheduled (Pending execution)',
      description:
        'The maintenance or inspection task is planned, awaiting technician dispatch, parts delivery, or scheduled service window.',
      icon: Clock,
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      activeBg: 'bg-amber-50/50',
      textColor: 'text-amber-700',
    },
    {
      status: 'completed',
      title: 'Completed (Work finished)',
      description:
        'The servicing, inspection, or repairs have been fully executed by the technician and the task is signed off.',
      icon: CheckCircle2,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeBg: 'bg-emerald-50/50',
      textColor: 'text-emerald-700',
    },
    {
      status: 'cancelled',
      title: 'Cancelled (Aborted / Superseded)',
      description:
        'The maintenance request was cancelled, deemed unnecessary, or replaced by another service order.',
      icon: Ban,
      activeBorder: 'border-gray-500 ring-2 ring-gray-500/20',
      activeBg: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Update Work Order Status</h2>
              <p className="text-xs text-gray-500">
                Change lifecycle status for this maintenance task
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

          {/* Context Card */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">{log.maintenanceType}</span>
              <span className="text-gray-500 ml-2">for {equipmentName || log.equipmentId}</span>
            </div>
            <span className="font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
              {log.maintenanceDate}
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Select New Work Order Status
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
                          name="maintenance-status"
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

          {/* Decoupling Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Decoupled Equipment Status:</strong> Marking this maintenance work order
              as completed or cancelled does not automatically toggle the equipment's operational
              floor status. Remember to update the equipment status in the Equipment Inventory if
              bringing the machine back into service.
            </div>
          </div>
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
