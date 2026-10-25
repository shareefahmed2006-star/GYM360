import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Wrench, Building2, Info } from 'lucide-react';
import { useCreateMaintenanceLog } from '../../hooks/useMaintenance';
import { useEquipmentList } from '../../hooks/useEquipment';
import { useBranches } from '../../hooks/useBranches';
import { MaintenanceLogStatus } from '../../types/maintenance.types';

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEquipmentId?: string;
}

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getFutureDateString = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const COMMON_TYPES = [
  'Routine Maintenance',
  'Preventative Inspection',
  'Emergency Repair',
  'Part Replacement',
  'Calibration & Safety Test',
  'Other',
];

export const CreateMaintenanceModal: React.FC<CreateMaintenanceModalProps> = ({
  isOpen,
  onClose,
  defaultEquipmentId,
}) => {
  const createLogMutation = useCreateMaintenanceLog();
  const { data: equipmentResponse, isLoading: isLoadingEquipment } = useEquipmentList({ limit: 100 });
  const { data: branches = [] } = useBranches();

  const equipmentList = equipmentResponse?.data || [];

  const branchMap = React.useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  const [equipmentId, setEquipmentId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('Routine Maintenance');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [cost, setCost] = useState('0');
  const [status, setStatus] = useState<MaintenanceLogStatus>('scheduled');
  const [maintenanceDate, setMaintenanceDate] = useState(getTodayString());
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(getFutureDateString(90));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setEquipmentId(defaultEquipmentId || (equipmentList[0]?._id ?? ''));
      setMaintenanceType('Routine Maintenance');
      setCustomType('');
      setDescription('');
      setPerformedBy('');
      setCost('0');
      setStatus('scheduled');
      setMaintenanceDate(getTodayString());
      setNextMaintenanceDate(getFutureDateString(90));
    }
  }, [isOpen, defaultEquipmentId, equipmentList]);

  if (!isOpen) return null;

  const selectedEquipment = equipmentList.find((e) => e._id === equipmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedType = maintenanceType === 'Other' ? customType.trim() : maintenanceType.trim();

    if (!equipmentId) {
      setErrorMsg('Please select an equipment asset.');
      return;
    }
    if (!resolvedType) {
      setErrorMsg('Maintenance type is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Description of work is required.');
      return;
    }
    if (!performedBy.trim()) {
      setErrorMsg('Technician or service company name is required.');
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

    try {
      // Note: branchId is intentionally omitted; the backend derives it from equipmentId
      await createLogMutation.mutateAsync({
        equipmentId,
        maintenanceType: resolvedType,
        description: description.trim(),
        performedBy: performedBy.trim(),
        cost: numCost,
        status,
        maintenanceDate,
        nextMaintenanceDate,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create maintenance work order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Maintenance Work Order</h2>
              <p className="text-xs text-gray-500">
                Log servicing, inspection, or repairs for gym equipment
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipment Selection */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Equipment Asset <span className="text-red-500">*</span>
              </label>
              {isLoadingEquipment ? (
                <div className="text-xs text-gray-400 py-2">Loading equipment assets...</div>
              ) : (
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
                  required
                >
                  <option value="" disabled>Select equipment asset</option>
                  {equipmentList.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.brand} {eq.model}) — S/N: {eq.serialNumber}
                    </option>
                  ))}
                </select>
              )}

              {/* Associated Branch Info Display */}
              {selectedEquipment && (
                <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Asset Location:{' '}
                      <strong className="text-gray-800">
                        {branchMap.get(selectedEquipment.branchId) || selectedEquipment.branchId}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 italic">
                    Derived automatically from equipment
                  </span>
                </div>
              )}
            </div>

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
                placeholder="e.g. Apex Technicians, Vendor Support"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Estimated / Actual Cost */}
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
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Initial Work Order Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceLogStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              >
                <option value="scheduled">Scheduled (Pending dispatch)</option>
                <option value="completed">Completed (Work already done)</option>
              </select>
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
            <div>
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

            {/* Description of Work */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Work Order Description & Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details of required inspection, replaced components, or diagnosis findings..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>
          </div>

          {/* Operational Decoupling Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>Decoupled Status Notice:</strong> Logging or completing a maintenance work
              order does not automatically change the physical equipment's operational status.
              Equipment operational status is managed independently in the Equipment Inventory.
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createLogMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLogMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createLogMutation.isPending ? 'Saving...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
