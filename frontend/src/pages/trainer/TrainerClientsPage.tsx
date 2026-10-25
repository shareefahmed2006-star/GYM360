import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trainerPortalApi } from '../../api/trainerPortalApi';
import {
  Users,
  Search,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const TrainerClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ['trainer-clients'],
    queryFn: trainerPortalApi.listClients,
  });

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Clients & Trainees</h1>
        <p className="text-sm text-gray-500 mt-1">
          Members who are currently training or have completed sessions under your guidance.
        </p>
      </div>

      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
          {filteredClients.length} Total Clients
        </span>
      </div>

      {/* Client Cards Grid */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center bg-white rounded-xl border border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <span className="text-xs text-gray-500">Loading client roster...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="text-sm font-semibold text-red-800">Failed to load clients</p>
          <p className="text-xs text-red-600 mt-1">{(error as any)?.message}</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No clients found</h3>
          <p className="text-xs text-gray-400 mt-1">
            Clients will appear here once sessions are scheduled with you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0">
                      {client.firstName[0]}
                      {client.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {client.firstName} {client.lastName}
                      </h3>
                      <span className="inline-block text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                        {client.status} Member
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-emerald-50/60 p-2 rounded-lg">
                    <span className="block text-xs font-semibold text-emerald-800">
                      {client.completedSessions}
                    </span>
                    <span className="text-[10px] text-emerald-600">Completed</span>
                  </div>
                  <div className="bg-blue-50/60 p-2 rounded-lg">
                    <span className="block text-xs font-semibold text-blue-800">
                      {client.upcomingSessions}
                    </span>
                    <span className="text-[10px] text-blue-600">Upcoming</span>
                  </div>
                </div>

                {client.lastSessionDate && (
                  <p className="text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Last session:</span>
                    <span className="font-medium text-gray-600">
                      {client.lastSessionDate} ({client.lastSessionType || 'General'})
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
