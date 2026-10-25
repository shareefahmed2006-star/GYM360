import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Edit, Building2 } from 'lucide-react';
import { useUpdateEquipment } from '../../hooks/useEquipment';
import { EquipmentDocument, UpdateEquipmentDTO } from '../../types/equipment.types';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentDocument | null;
  branchName?: string;
}

const COMMON_CATEGORIES = [
  'Cardio',
  'Strength',
  'Free Weights',
  'Functional Training',
  'Recovery & Wellness',
  'Other',
];

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  isOpen,
  onClose,
  equipment,
  branchName,
}) => {
  const updateEquipmentMutation = useUpdateEquipment();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cardio');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && equipment) {
      setErrorMsg(null);
      setName(equipment.name || '');
      if (COMMON_CATEGORIES.includes(equipment.category)) {
        setCategory(equipment.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(equipment.category || '');
      }
      setBrand(equipment.brand || '');
      setModel(equipment.model || '');
      setSerialNumber(equipment.serialNumber || '');
      setPurchaseDate(equipment.purchaseDate || '');
      setLastMaintenanceDate(equipment.lastMaintenanceDate || '');
      setNextMaintenanceDate(equipment.nextMaintenanceDate || '');
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedCategory = category === 'Other' ? customCategory.trim() : category.trim();

    if (!name.trim()) {
      setErrorMsg('Equipment name cannot be empty.');
      return;
    }
    if (!resolvedCategory) {
      setErrorMsg('Category is required.');
      return;
    }
    if (!brand.trim()) {
      setErrorMsg('Brand cannot be empty.');
      return;
    }
    if (!model.trim()) {
      setErrorMsg('Model cannot be empty.');
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMsg('Serial number cannot be empty.');
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

    // Construct update payload containing ONLY mutable fields
    // Guarantee _id, organizationId, and branchId are never included
    const dto: UpdateEquipmentDTO = {
      name: name.trim(),
      category: resolvedCategory,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate,
      lastMaintenanceDate,
      nextMaintenanceDate,
    };

    try {
      await updateEquipmentMutation.mutateAsync({
        equipmentId: equipment._id,
        dto,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update equipment details.');
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
              <h2 className="text-lg font-bold text-gray-900">Edit Equipment Details</h2>
              <p className="text-xs text-gray-500">
                Update asset specifications and scheduled maintenance dates
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

          {/* Immutable Branch Badge */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>
                Assigned Branch:{' '}
                <strong className="text-gray-800">{branchName || equipment.branchId}</strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-500 italic">Branch assignment is fixed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipment Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Serial Number */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
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
                Next Maintenance Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
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
              disabled={updateEquipmentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateEquipmentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {updateEquipmentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
