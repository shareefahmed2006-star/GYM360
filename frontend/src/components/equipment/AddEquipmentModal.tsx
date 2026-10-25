import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Dumbbell } from 'lucide-react';
import { useCreateEquipment } from '../../hooks/useEquipment';
import { useBranches } from '../../hooks/useBranches';
import { EquipmentStatus } from '../../types/equipment.types';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBranchId?: string;
}

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getFutureDateString = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const COMMON_CATEGORIES = [
  'Cardio',
  'Strength',
  'Free Weights',
  'Functional Training',
  'Recovery & Wellness',
  'Other',
];

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  defaultBranchId,
}) => {
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const createEquipmentMutation = useCreateEquipment();

  const activeBranches = branches.filter((b) => b.status === 'active');

  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cardio');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [status, setStatus] = useState<EquipmentStatus>('operational');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(getTodayString());
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(getFutureDateString(90));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setBranchId(defaultBranchId || (activeBranches[0]?._id ?? ''));
      setName('');
      setCategory('Cardio');
      setCustomCategory('');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setPurchaseDate(getTodayString());
      setStatus('operational');
      setLastMaintenanceDate(getTodayString());
      setNextMaintenanceDate(getFutureDateString(90));
    }
  }, [isOpen, defaultBranchId, activeBranches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedCategory = category === 'Other' ? customCategory.trim() : category.trim();

    if (!name.trim()) {
      setErrorMsg('Equipment name is required.');
      return;
    }
    if (!resolvedCategory) {
      setErrorMsg('Category is required.');
      return;
    }
    if (!brand.trim()) {
      setErrorMsg('Brand is required.');
      return;
    }
    if (!model.trim()) {
      setErrorMsg('Model is required.');
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMsg('Serial number is required.');
      return;
    }
    if (!branchId) {
      setErrorMsg('Please select a branch.');
      return;
    }
    if (!purchaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setErrorMsg('Purchase date must be in YYYY-MM-DD format.');
      return;
    }
    if (!lastMaintenanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastMaintenanceDate)) {
      setErrorMsg('Last maintenance date must be in YYYY-MM-DD format.');
      return;
    }
    if (!nextMaintenanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextMaintenanceDate)) {
      setErrorMsg('Next maintenance date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      await createEquipmentMutation.mutateAsync({
        branchId,
        name: name.trim(),
        category: resolvedCategory,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        purchaseDate,
        status,
        lastMaintenanceDate,
        nextMaintenanceDate,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register equipment. Please check input fields.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Register New Equipment</h2>
              <p className="text-xs text-gray-500">
                Add a gym fitness asset and schedule maintenance cycles
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
            {/* Branch Assignment */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Branch Location <span className="text-red-500">*</span>
              </label>
              {isLoadingBranches ? (
                <div className="text-xs text-gray-400 py-2">Loading branches...</div>
              ) : (
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
                  required
                >
                  <option value="" disabled>Select assigned branch</option>
                  {activeBranches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Equipment Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Treadmill TF-100"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Specify custom category..."
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500"
                  required
                />
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Brand / Manufacturer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Life Fitness, Concept2"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Model Number / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Integrity Series CLST"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. GYM360-TM-001"
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Operational Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
              >
                <option value="operational">Operational</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Last Maintenance Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Last Maintenance Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={lastMaintenanceDate}
                onChange={(e) => setLastMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Next Maintenance Date */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Next Scheduled Maintenance Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Gym safety regulations recommend inspecting high-utilization equipment every 90 days.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createEquipmentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEquipmentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createEquipmentMutation.isPending ? 'Registering...' : 'Register Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
