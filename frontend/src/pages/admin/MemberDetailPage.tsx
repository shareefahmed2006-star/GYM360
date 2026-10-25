import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useMember,
  useUpdateMember,
  useUpdateMemberStatus,
} from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { MemberStatusConfirmModal } from '../../components/member/MemberStatusConfirmModal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Power,
  Save,
  ShieldAlert,
  HeartPulse,
} from 'lucide-react';

export const MemberDetailPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();

  const { data: member, isLoading, isError, error, refetch } = useMember(memberId);
  const { data: branches = [] } = useBranches();
  const updateMemberMutation = useUpdateMember();
  const updateStatusMutation = useUpdateMemberStatus();

  // Active branches belonging strictly to the tenant
  const activeBranches = branches.filter((b) => b.status === 'active');

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for profile updating & branch reassignment
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    branchId: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone || '',
        branchId: member.branchId,
        dateOfBirth: member.dateOfBirth || '',
        gender: member.gender || '',
        emergencyContactName: member.emergencyContact?.name || '',
        emergencyContactPhone: member.emergencyContact?.phone || '',
      });
    }
  }, [member]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-28 animate-pulse" />
        <div className="bg-white rounded-2xl p-8 border border-gray-200 h-96 animate-pulse" />
      </div>
    );
  }

  if (isError || !member) {
    const statusCode = (error as any)?.statusCode;
    const is403 = statusCode === 403;
    const is404 = statusCode === 404;

    return (
      <div className="space-y-6">
        <Link
          to="/admin/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Member Directory
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {is403
              ? 'Access Denied'
              : is404
              ? 'Member Profile Not Found or Unavailable'
              : 'Unable to Load Member Profile'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            {is403
              ? 'You do not have authorization to view this member profile.'
              : is404
              ? 'The requested member does not exist or does not belong to your organization.'
              : (error as any)?.message || 'A network error occurred.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/admin/members"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Back to Directory
            </Link>
            {!is403 && !is404 && (
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg"
              >
                Retry Request
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isActive = member.status === 'active';
  const targetStatus = isActive ? 'inactive' : 'active';
  const currentBranch = branches.find((b) => b._id === member.branchId);

  const handleStatusToggleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        memberId: member._id,
        status: targetStatus,
      });
      setIsStatusModalOpen(false);
      setFormSuccess(`Member status updated to ${targetStatus}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update member status.');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      setFormError('Member first and last names are required.');
      return;
    }

    try {
      await updateMemberMutation.mutateAsync({
        memberId: member._id,
        dto: {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          phone: formData.phone.trim() || undefined,
          branchId: formData.branchId || undefined,
          dateOfBirth: formData.dateOfBirth.trim() || undefined,
          gender: formData.gender.trim() || undefined,
          emergencyContact:
            formData.emergencyContactName.trim() && formData.emergencyContactPhone.trim()
              ? {
                  name: formData.emergencyContactName.trim(),
                  phone: formData.emergencyContactPhone.trim(),
                }
              : undefined,
        },
      });
      setFormSuccess('Member profile updated successfully.');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update member profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Member Directory</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsStatusModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            isActive
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isActive ? 'Deactivate Member Profile' : 'Reactivate Member Profile'}</span>
        </button>
      </div>

      {/* 2. Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gym-50 text-gym-700 flex items-center justify-center shrink-0 border border-gym-100 font-bold text-xl">
            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {member.firstName} {member.lastName}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {member.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Member ID: <span className="font-mono">{member._id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Primary Email</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              {member.email}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Home Facility</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              {currentBranch?.name || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Contact Phone</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {member.phone || 'Not provided'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. In-Place Edit Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h2 className="text-base font-bold text-gray-900">Edit Member Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Modify personal records, branch reassignment, or emergency contacts. (Email is fixed per unique tenant account identity).
          </p>
        </div>

        {formSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {formSuccess}
          </div>
        )}

        {formError && (
          <div className="mb-6">
            <ErrorAlert message={formError} onClose={() => setFormError(null)} />
          </div>
        )}

        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reassign Home Branch
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white"
              >
                {activeBranches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.address.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none bg-white"
              >
                <option value="">Not Specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          {/* Emergency Contact Sub-form */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Emergency Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={updateMemberMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateMemberMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Status Confirm Modal */}
      <MemberStatusConfirmModal
        isOpen={isStatusModalOpen}
        memberName={`${member.firstName} ${member.lastName}`}
        targetStatus={targetStatus}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleStatusToggleConfirm}
        onCancel={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};
