import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Edit3 } from 'lucide-react';
import { useUpdateTrainer } from '../../hooks/useTrainers';
import { useBranches } from '../../hooks/useBranches';
import { TrainerDocument } from '../../types/trainer.types';

interface EditTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: TrainerDocument | null;
}

export const EditTrainerModal: React.FC<EditTrainerModalProps> = ({
  isOpen,
  onClose,
  trainer,
}) => {
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const updateTrainerMutation = useUpdateTrainer();

  const activeBranches = branches.filter((b) => b.status === 'active');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [experienceYears, setExperienceYears] = useState<string>('0');
  const [specializationsInput, setSpecializationsInput] = useState('');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && trainer) {
      setErrorMsg(null);
      setFirstName(trainer.firstName || '');
      setLastName(trainer.lastName || '');
      setPhone(trainer.phone || '');
      setBranchId(trainer.branchId || '');
      setExperienceYears(String(trainer.experienceYears ?? 0));
      setSpecializationsInput(trainer.specialization ? trainer.specialization.join(', ') : '');
      setBio(trainer.bio || '');
    }
  }, [isOpen, trainer]);

  if (!isOpen || !trainer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !bio.trim()) {
      setErrorMsg('All fields marked with an asterisk are required.');
      return;
    }

    if (!branchId) {
      setErrorMsg('Please select a valid assigned branch.');
      return;
    }

    const exp = parseInt(experienceYears, 10);
    if (!Number.isInteger(exp) || exp < 0) {
      setErrorMsg('Experience years must be a non-negative integer.');
      return;
    }

    const specializations = specializationsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (specializations.length === 0) {
      setErrorMsg('Please enter at least one specialization (comma-separated).');
      return;
    }

    try {
      await updateTrainerMutation.mutateAsync({
        trainerId: trainer._id,
        dto: {
          branchId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          experienceYears: exp,
          specialization: specializations,
          bio: bio.trim(),
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update trainer profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-gym-600" />
              Edit Trainer Profile
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Update coach details, branch assignment, and professional credentials.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Immutable Email Banner */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
            <span className="text-gray-500">Email Address (Immutable): </span>
            <span className="font-mono font-medium text-gray-800">{trainer.email}</span>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={updateTrainerMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={updateTrainerMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
                required
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={updateTrainerMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Assigned Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={isLoadingBranches || updateTrainerMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500 bg-white"
                required
              >
                <option value="">Select branch...</option>
                {activeBranches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.address.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Experience & Specializations */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Experience (Years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              disabled={updateTrainerMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Specializations (Comma-separated) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={specializationsInput}
              onChange={(e) => setSpecializationsInput(e.target.value)}
              placeholder="e.g. CrossFit, Strength Training"
              disabled={updateTrainerMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Professional Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={updateTrainerMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gym-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={updateTrainerMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTrainerMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 rounded-lg hover:bg-gym-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {updateTrainerMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
