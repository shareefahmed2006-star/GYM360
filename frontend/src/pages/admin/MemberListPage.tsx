import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMembers, useUpdateMemberStatus, useDeleteMember } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { MemberDocument, MemberStatus } from '../../types/member.types';
import { CreateMemberModal } from '../../components/member/CreateMemberModal';
import { MemberStatusConfirmModal } from '../../components/member/MemberStatusConfirmModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  Power,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export const MemberListPage: React.FC = () => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMembers(selectedBranchFilter || undefined);

  const { data: branches = [] } = useBranches();
  const updateStatusMutation = useUpdateMemberStatus();
  const deleteMemberMutation = useDeleteMember();

  // Create modal and status confirm modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberDocument | null>(null);
  const [statusModalMember, setStatusModalMember] = useState<{
    id: string;
    name: string;
    targetStatus: MemberStatus;
  } | null>(null);

  // Map branch ID to branch name
  const branchMap = new Map(branches.map((b) => [b._id, b.name]));

  // Filter members client-side for search query and status filter
  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone && m.phone.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = members.filter((m) => m.status === 'active').length;
  const inactiveCount = members.filter((m) => m.status === 'inactive').length;

  const handleStatusToggleRequest = (member: MemberDocument) => {
    const targetStatus: MemberStatus =
      member.status === 'active' ? 'inactive' : 'active';
    setStatusModalMember({
      id: member._id,
      name: `${member.firstName} ${member.lastName}`,
      targetStatus,
    });
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusModalMember) return;
    try {
      await updateStatusMutation.mutateAsync({
        memberId: statusModalMember.id,
        status: statusModalMember.targetStatus,
      });
      setStatusModalMember(null);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Action */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <Users className="w-4 h-4" />
            Member Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Member Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Search, register, and manage member profiles across your organization's facilities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh member list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gym-600 hover:bg-gym-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Register Member
          </button>
        </div>
      </div>

      {/* 2. Search & Branch/Status Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Members ({members.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-gray-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Inactive ({inactiveCount})
          </button>

          {/* Branch Dropdown Filter */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gym-500"
            >
              <option value="">All Home Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gym-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 3. Member Directory Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-center justify-between">
          <div>
            <p className="font-bold">Failed to load member directory.</p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.message || 'Please check your connection and authorization.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No members found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            {searchQuery || selectedBranchFilter
              ? 'No member records match your active search or branch filter criteria.'
              : 'No members registered in your organization yet. Click Register Member above to create a profile.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Member Name</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Assigned Home Branch</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => {
                  const isActive = member.status === 'active';
                  const branchName = branchMap.get(member.branchId) || 'Unknown Branch';

                  return (
                    <tr
                      key={member._id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-gray-900 text-sm">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          ID: {member._id.slice(-6)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{branchName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusToggleRequest(member)}
                            title={isActive ? 'Deactivate member profile' : 'Reactivate member profile'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/members/${member._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingMember(member)}
                            title="Delete member permanently"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modals */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <MemberStatusConfirmModal
        isOpen={!!statusModalMember}
        memberName={statusModalMember?.name || ''}
        targetStatus={statusModalMember?.targetStatus || 'active'}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setStatusModalMember(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={async () => {
          if (deletingMember) {
            await deleteMemberMutation.mutateAsync(deletingMember._id);
            setDeletingMember(null);
          }
        }}
        title="Delete Member Profile"
        itemName={deletingMember ? `${deletingMember.firstName} ${deletingMember.lastName} (${deletingMember.email})` : ''}
        isLoading={deleteMemberMutation.isPending}
      />
    </div>
  );
};
