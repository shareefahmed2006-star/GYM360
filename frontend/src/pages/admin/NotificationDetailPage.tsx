import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  AlertTriangle,
  Info,
  Tag,
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotifications';
import { useBranch } from '../../hooks/useBranches';
import { NotificationStatusModal } from '../../components/notification/NotificationStatusModal';
import { NotificationPriority, NotificationStatus } from '../../types/notification.types';

export const NotificationDetailPage: React.FC = () => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();

  const {
    data: notification,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNotification(notificationId);

  // Associated Branch details
  const { data: branch } = useBranch(notification?.branchId);

  // Status modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-gym-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading in-app notification...</p>
      </div>
    );
  }

  if (isError || !notification) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl border border-gray-200/80 shadow-xs text-center mt-6">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Notification Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {(error as any)?.message ||
            'The requested notification record could not be found or you do not have permission to view it.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/notifications')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Notifications Directory
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gym-600 text-white rounded-lg text-sm font-medium hover:bg-gym-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            High Priority Alert
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium Priority
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            Low Priority
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    return status === 'unread' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5" />
        Unread
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
        Read
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/admin/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gym-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to In-App Notifications
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gym-50 text-gym-700 rounded-xl border border-gym-100 shrink-0">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{notification.title}</h1>
                {getStatusBadge(notification.status)}
                {getPriorityBadge(notification.priority)}
              </div>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                Category: <strong>{notification.type.replace('_', ' ')}</strong> • Dispatched on{' '}
                <strong>{notification.createdAt}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh notification"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Toggle Read Status
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Message Body & Recipient Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Content Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Tag className="w-4 h-4 text-gym-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              In-App Notification Message Body
            </h2>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </div>

          {/* Delivery Semantics Advisory */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>In-App Delivery Semantics:</strong> This record exists as an in-app
              notification accessible within the recipient's in-app hub. In accordance with system
              audit policy, notification contents are immutable after dispatch.
            </div>
          </div>
        </div>

        {/* Metadata & Recipient Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="w-4 h-4 text-gym-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Recipient & Dispatch Info
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recipient User ID
              </span>
              <p className="font-mono text-xs text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200 mt-1 inline-block">
                {notification.recipientUserId}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Refers to the recipient's account identifier in the organization.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Attributing Branch
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-gym-600" />
                <span className="font-semibold text-gray-900">
                  {branch?.name || notification.branchId}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Dispatched Date
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{notification.createdAt}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Category
              </span>
              <p className="font-medium text-gray-900 mt-0.5 capitalize">
                {notification.type.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <NotificationStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        notification={notification}
      />
    </div>
  );
};
