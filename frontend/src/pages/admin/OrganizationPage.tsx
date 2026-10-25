import React, { useState, useEffect } from 'react';
import { useOrganization, useUpdateOrganization } from '../../hooks/useOrganization';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  Building2,
  Mail,
  MapPin,
  Save,
  RefreshCw,
} from 'lucide-react';

export const OrganizationPage: React.FC = () => {
  const { data: organization, isLoading, isError, error, refetch, isFetching } =
    useOrganization();
  const updateOrgMutation = useUpdateOrganization();

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        street: organization.address.street,
        city: organization.address.city,
        state: organization.address.state,
        postalCode: organization.address.postalCode,
      });
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedStreet = formData.street.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();
    const trimmedPostal = formData.postalCode.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedStreet ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostal
    ) {
      setFormError('Organization name, contact details, and full address are required.');
      return;
    }

    try {
      await updateOrgMutation.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: {
          street: trimmedStreet,
          city: trimmedCity,
          state: trimmedState,
          postalCode: trimmedPostal,
        },
      });
      setFormSuccess('Organization profile updated successfully.');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update organization.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-28 animate-pulse" />
        <div className="bg-white rounded-2xl p-8 border border-gray-200 h-96 animate-pulse" />
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center max-w-lg mx-auto shadow-xs">
        <h2 className="text-lg font-bold text-gray-900">Failed to load organization</h2>
        <p className="text-xs text-red-600 mt-1 mb-4">
          {(error as any)?.message || 'Unable to retrieve organization profile.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <Building2 className="w-4 h-4" />
            Enterprise Organization
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Organization Profile
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your legal entity profile, business email, and headquarter details.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          title="Refresh organization details"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
        </button>
      </div>

      {/* 2. Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gym-50 text-gym-700 flex items-center justify-center shrink-0 border border-gym-100">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {organization.name}
              </h2>
              {/* Note: status is strictly read-only, matching backend capabilities */}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {organization.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Tenant Identifier: <span className="font-mono">{organization._id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Primary Contact</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              {organization.email}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Headquarters</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {organization.address.city}, {organization.address.state}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Edit Organization Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h3 className="text-base font-bold text-gray-900">Entity & Contact Information</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Modify business name, official email, phone, and headquarters address.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gym-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={updateOrgMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateOrgMutation.isPending ? 'Saving...' : 'Save Organization Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
