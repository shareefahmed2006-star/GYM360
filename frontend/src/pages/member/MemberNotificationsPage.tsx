import React, { useState } from 'react';
import { useNotifications, useUpdateNotificationStatus } from '../../hooks/useNotifications';
import {
  Bell,
  CheckCircle2,
  MailCheck,
  RefreshCw,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import { NotificationDocument, NotificationStatus } from '../../types/notification.types';

export const MemberNotificationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    data: notificationResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useNotifications({
    status: statusFilter === 'all' ? undefined : (statusFilter as NotificationStatus),
  });

  const updateStatusMutation = useUpdateNotificationStatus();

  const notifications: NotificationDocument[] = notificationResponse?.data || [];

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const handleUpdateStatus = async (
    notificationId: string,
    newStatus: NotificationStatus
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        notificationId,
        dto: { status: newStatus },
      });
      setActionSuccess(`Notification marked as ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      refetch();
    } catch {
      // Handled by react-query mutation error
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'membership_expiry':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'facility_alert':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'billing_reminder':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gym-700 mb-1">
            <Bell className="w-4 h-4" />
            Member Inbox & Announcements
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Notifications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Stay informed with facility updates, membership renewals, and class announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-gym-600' : ''}`} />
            {isFetching ? 'Syncing...' : 'Sync Inbox'}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gym-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 bg-gray-100'
            }`}
          >
            All Messages
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unread')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'unread'
                ? 'bg-gym-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 bg-gray-100'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('read')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'read'
                ? 'bg-gym-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 bg-gray-100'
            }`}
          >
            Read
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline">
          {notifications.length} message{notifications.length === 1 ? '' : 's'} in view
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-xs text-red-700">
            Failed to load notifications.
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 space-y-2">
            <Bell className="w-8 h-8 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">Your Inbox is Empty</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              You have no notifications matching this category.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = n.status === 'unread';

            return (
              <div
                key={n._id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isUnread
                    ? 'border-gym-300 bg-gym-50/20 shadow-xs'
                    : 'border-gray-200 shadow-2xs opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnread
                          ? 'bg-gym-100 text-gym-700 border-gym-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm ${
                            isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                          }`}
                        >
                          {n.title}
                        </h3>

                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(
                            n.priority
                          )}`}
                        >
                          {n.priority}
                        </span>

                        <span className="text-[10px] text-gray-400 font-mono">
                          {n.createdAt?.slice(0, 10)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed max-w-2xl whitespace-pre-wrap">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(n._id, 'read')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gym-700 hover:text-gym-900 bg-gym-50 hover:bg-gym-100 rounded-lg cursor-pointer transition-colors"
                        title="Mark as Read"
                      >
                        <MailCheck className="w-3.5 h-3.5" />
                        Mark Read
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(n._id, 'unread')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                        title="Mark as Unread"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Unread
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
