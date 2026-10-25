import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Building2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  AlertTriangle,
  MailCheck,
  Trash2,
} from 'lucide-react';
import { useNotifications, useDeleteNotification } from '../../hooks/useNotifications';
import { useBranches } from '../../hooks/useBranches';
import { DispatchNotificationModal } from '../../components/notification/DispatchNotificationModal';
import { NotificationStatusModal } from '../../components/notification/NotificationStatusModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { NotificationDocument, NotificationPriority, NotificationStatus } from '../../types/notification.types';

export const NotificationListPage: React.FC = () => {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 50;

  // Modals state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<NotificationDocument | null>(null);
  const [selectedNotificationForStatus, setSelectedNotificationForStatus] =
    useState<NotificationDocument | null>(null);

  const deleteNotificationMutation = useDeleteNotification();

  // Server-supported filters
  const apiFilters = useMemo(() => {
    const filters: {
      branchId?: string;
      priority?: string;
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    } = {
      page: currentPage,
      limit,
    };
    if (branchFilter !== 'all') filters.branchId = branchFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (typeFilter !== 'all') filters.type = typeFilter;
    return filters;
  }, [branchFilter, priorityFilter, statusFilter, typeFilter, currentPage, limit]);

  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNotifications(apiFilters);

  const { data: branches = [] } = useBranches();

  // Branch mapping
  const branchMap = useMemo(() => {
    return new Map(branches.map((b) => [b._id, b.name]));
  }, [branches]);

  const notifications = notificationsResponse?.data || [];
  const totalPages = notificationsResponse?.totalPages || 1;
  const serverTotalCount = notificationsResponse?.total ?? 0;

  // Extract distinct recipient User IDs from loaded notifications to offer as suggestions
  const recentRecipientSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    notifications.forEach((n) => {
      if (n.recipientUserId && !map.has(n.recipientUserId)) {
        map.set(n.recipientUserId, `Recipient ${n.recipientUserId.slice(-6)}`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [notifications]);

  // Extract distinct types from loaded data to augment type filter
  const allTypes = useMemo(() => {
    const defaults = ['announcement', 'membership_expiry', 'facility_alert', 'billing_reminder', 'general'];
    const set = new Set<string>(defaults);
    notifications.forEach((n) => {
      if (n.type) set.add(n.type);
    });
    return Array.from(set).sort();
  }, [notifications]);

  // Client-side text search over loaded records
  const filteredNotifications = useMemo(() => {
    if (!searchTerm.trim()) return notifications;
    const q = searchTerm.toLowerCase();

    return notifications.filter((item) => {
      const title = item.title.toLowerCase();
      const message = item.message.toLowerCase();
      const type = item.type.toLowerCase();
      const recipient = item.recipientUserId.toLowerCase();
      const branchName = (branchMap.get(item.branchId) || '').toLowerCase();

      return (
        title.includes(q) ||
        message.includes(q) ||
        type.includes(q) ||
        recipient.includes(q) ||
        branchName.includes(q)
      );
    });
  }, [notifications, searchTerm, branchMap]);

  // Statistics calculated strictly over loaded records
  const loadedMetrics = useMemo(() => {
    let unreadCount = 0;
    let readCount = 0;
    let highPriorityCount = 0;

    for (const item of notifications) {
      if (item.status === 'unread') unreadCount++;
      else if (item.status === 'read') readCount++;

      if (item.priority === 'high') highPriorityCount++;
    }

    return {
      loadedTotal: notifications.length,
      unreadCount,
      readCount,
      highPriorityCount,
    };
  }, [notifications]);

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            Low
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    return status === 'unread' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3" />
        Unread
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <CheckCircle2 className="w-3 h-3 text-gray-500" />
        Read
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-gym-600" />
            In-App Notifications Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dispatch single-recipient in-app announcements, alerts, and member notices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gym-600 hover:bg-gym-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Dispatch In-App Notification
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Total Org Notifications */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Dispatched
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoading ? '...' : serverTotalCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Org-wide</span>
          </div>
        </div>

        {/* Metric 2: Unread in Loaded Page */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs bg-blue-50/10">
          <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Unread
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700">
              {isLoading ? '...' : loadedMetrics.unreadCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Page {currentPage}</span>
          </div>
        </div>

        {/* Metric 3: Read in Loaded Page */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <MailCheck className="w-3.5 h-3.5 text-gray-500" />
            Read
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-700">
              {isLoading ? '...' : loadedMetrics.readCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Page {currentPage}</span>
          </div>
        </div>

        {/* Metric 4: High Priority in Loaded Page */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs bg-rose-50/10">
          <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            High Priority
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-700">
              {isLoading ? '...' : loadedMetrics.highPriorityCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Page {currentPage}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Client Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, message, recipient..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category / Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white capitalize"
            >
              <option value="all">All Categories</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Search Scope Notice */}
        {searchTerm.trim() && (
          <div className="text-[11px] text-gray-500 flex items-center justify-between px-1">
            <span>
              Searching within currently loaded page records: showing{' '}
              <strong>{filteredNotifications.length}</strong> of{' '}
              <strong>{notifications.length}</strong> loaded notifications
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-gym-600 hover:text-gym-700 underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gym-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Loading in-app notifications...</p>
            <p className="text-xs text-gray-400 mt-1">Retrieving dispatched notification records</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900">Failed to load notifications</p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.message || 'An error occurred while fetching in-app notifications.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-gym-700 bg-gym-50 hover:bg-gym-100 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-800">No notifications found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {searchTerm || branchFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No notifications match your current filter criteria. Try resetting filters.'
                : 'No in-app notifications have been created yet. Click "Dispatch In-App Notification" to create one.'}
            </p>
            {(searchTerm || branchFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setBranchFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-1.5 text-xs font-semibold text-gym-700 bg-gym-50 hover:bg-gym-100 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Headline & Category</th>
                  <th className="px-4 py-3">Message Preview</th>
                  <th className="px-4 py-3">Recipient User ID</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Read Status</th>
                  <th className="px-4 py-3">Dispatched Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredNotifications.map((notif) => (
                  <tr key={notif._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Headline & Category */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{notif.title}</div>
                      <div className="inline-block px-2 py-0.5 mt-1 rounded text-[11px] font-medium bg-gray-100 text-gray-600 capitalize">
                        {notif.type.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-xs text-gray-600 truncate" title={notif.message}>
                        {notif.message}
                      </p>
                    </td>

                    {/* Recipient User ID */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {notif.recipientUserId}
                        </span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{branchMap.get(notif.branchId) || notif.branchId}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5">
                      {getPriorityBadge(notif.priority)}
                    </td>

                    {/* Read Status */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(notif.status)}
                    </td>

                    {/* Dispatched Date */}
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-mono">
                      {notif.createdAt}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/notifications/${notif._id}`}
                          className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          title="View notification details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setSelectedNotificationForStatus(notif)}
                          className="p-1.5 text-gray-500 hover:text-gym-700 hover:bg-gym-50 rounded-lg transition-colors"
                          title="Update read status"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingNotification(notif)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete notification permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total matching records in organization: <strong>{serverTotalCount}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Notification Modal */}
      <DispatchNotificationModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        recentRecipientIds={recentRecipientSuggestions}
      />

      {/* Change Status Modal */}
      <NotificationStatusModal
        isOpen={!!selectedNotificationForStatus}
        onClose={() => setSelectedNotificationForStatus(null)}
        notification={selectedNotificationForStatus}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingNotification}
        onClose={() => setDeletingNotification(null)}
        onConfirm={async () => {
          if (deletingNotification) {
            await deleteNotificationMutation.mutateAsync(deletingNotification._id);
            setDeletingNotification(null);
          }
        }}
        title="Delete Notification"
        itemName={deletingNotification ? deletingNotification.title : ''}
        isLoading={deleteNotificationMutation.isPending}
      />
    </div>
  );
};
