import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Edit, Dumbbell, Building2 } from 'lucide-react';
import { useUpdateMaintenanceLog } from '../../hooks/useMaintenance';
import { MaintenanceLogDocument, UpdateMaintenanceLogDTO } from '../../types/maintenance.types';

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MaintenanceLogDocument | null;
  equipmentName?: string;
  branchName?: string;
}

const COMMON_TYPES = [
  'Routine Maintenance',
  'Preventative Inspection',
  'Emergency Repair',
  'Part Replacement',
  'Calibration & Safety Test',
  'Other',
];

export const EditMaintenanceModal: React.FC<EditMaintenanceModalProps> = ({
  isOpen,
  onClose,
  log,
  equipmentName,
  branchName,
}) => {
  const updateLogMutation = useUpdateMaintenanceLog();

  const [maintenanceType, setMaintenanceType] = useState('Routine Maintenance');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [cost, setCost] = useState('0');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && log) {
      setErrorMsg(null);
      if (COMMON_TYPES.includes(log.maintenanceType)) {
        setMaintenanceType(log.maintenanceType);
        setCustomType('');
      } else {
        setMaintenanceType('Other');
        setCustomType(log.maintenanceType);
      }
      setDescription(log.description || '');
      setPerformedBy(log.performedBy || '');
      setCost(String(log.cost ?? 0));
      setMaintenanceDate(log.maintenanceDate || '');
      setNextMaintenanceDate(log.nextMaintenanceDate || '');
    }
  }, [isOpen, log]);

  if (!isOpen || !log) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedType = maintenanceType === 'Other' ? customType.trim() : maintenanceType.trim();

    if (!resolvedType) {
      setErrorMsg('Maintenance type cannot be empty.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Description cannot be empty.');
      return;
    }
    if (!performedBy.trim()) {
      setErrorMsg('Technician / Service provider cannot be empty.');
      return;
    }
    const numCost = Number(cost);
    if (isNaN(numCost) || numCost < 0) {
      setErrorMsg('Cost must be a valid number greater than or equal to 0.');
      return;
    }
    if (!maintenanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(maintenanceDate)) {
      setErrorMsg('Maintenance date must be in YYYY-MM-DD format.');
      return;
    }
    if (!nextMaintenanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextMaintenanceDate)) {
      setErrorMsg('Next maintenance date must be in YYYY-MM-DD format.');
      return;
    }

    // Construct sanitized payload guaranteeing _id, organizationId, branchId, equipmentId are omitted
    const dto: UpdateMaintenanceLogDTO = {
      maintenanceType: resolvedType,
      description: description.trim(),
      performedBy: performedBy.trim(),
      cost: numCost,
      maintenanceDate,
      nextMaintenanceDate,
    };

    try {
      await updateLogMutation.mutateAsync({
        logId: log._id,
        dto,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update maintenance log.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Maintenance Work Order</h2>
              <p className="text-xs text-gray-500">
                Update servicing specifications, cost, and technician notes
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Read-Only Asset & Branch Context */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-gym-600 shrink-0" />
              <span>
                Equipment: <strong className="text-gray-900">{equipmentName || log.equipmentId}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                Branch: <strong className="text-gray-900">{branchName || log.branchId}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              >
                {COMMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {maintenanceType === 'Other' && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Specify custom type..."
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500"
                  required
                />
              )}
            </div>

            {/* Performed By / Technician */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Technician / Service Provider <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Cost ($ USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Maintenance Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Maintenance Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Next Maintenance Date */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Next Inspection Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Work Order Description & Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updateLogMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLogMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {updateLogMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
