import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Bell, User, Building2, Info, Send } from 'lucide-react';
import { useCreateNotification } from '../../hooks/useNotifications';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../hooks/useAuth';
import { NotificationPriority } from '../../types/notification.types';

interface DispatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentRecipientIds?: { id: string; label: string }[];
}

const COMMON_TYPES = [
  'announcement',
  'membership_expiry',
  'facility_alert',
  'billing_reminder',
  'general',
  'Other',
];

const getTodayString = (): string => new Date().toISOString().split('T')[0];

export const DispatchNotificationModal: React.FC<DispatchNotificationModalProps> = ({
  isOpen,
  onClose,
  recentRecipientIds = [],
}) => {
  const { user } = useAuth();
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const createNotificationMutation = useCreateNotification();

  const activeBranches = branches.filter((b) => b.status === 'active');

  const [branchId, setBranchId] = useState('');
  const [recipientMode, setRecipientMode] = useState<'self' | 'recent' | 'manual'>('self');
  const [selectedRecentRecipient, setSelectedRecentRecipient] = useState('');
  const [manualRecipientId, setManualRecipientId] = useState('');
  const [type, setType] = useState('announcement');
  const [customType, setCustomType] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setBranchId(activeBranches[0]?._id ?? '');
      setRecipientMode('self');
      setSelectedRecentRecipient(recentRecipientIds[0]?.id ?? '');
      setManualRecipientId('');
      setType('announcement');
      setCustomType('');
      setPriority('medium');
      setTitle('');
      setMessage('');
    }
  }, [isOpen, activeBranches, recentRecipientIds]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Determine target recipientUserId
    let resolvedRecipientUserId = '';
    if (recipientMode === 'self') {
      resolvedRecipientUserId = user?.id || '';
    } else if (recipientMode === 'recent') {
      resolvedRecipientUserId = selectedRecentRecipient;
    } else {
      resolvedRecipientUserId = manualRecipientId.trim();
    }

    // Validate 24-hex ObjectId format
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;

    if (!branchId || !objectIdRegex.test(branchId)) {
      setErrorMsg('Please select a valid branch location.');
      return;
    }

    if (!resolvedRecipientUserId || !objectIdRegex.test(resolvedRecipientUserId)) {
      setErrorMsg(
        'A valid 24-character hexadecimal Recipient User ID is required. Please check the recipient ID.'
      );
      return;
    }

    const resolvedType = type === 'Other' ? customType.trim() : type.trim();

    if (!resolvedType) {
      setErrorMsg('Notification category type is required.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Notification headline / title is required.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Notification message body is required.');
      return;
    }

    try {
      await createNotificationMutation.mutateAsync({
        branchId,
        recipientUserId: resolvedRecipientUserId,
        type: resolvedType,
        title: title.trim(),
        message: message.trim(),
        priority,
        status: 'unread',
        createdAt: getTodayString(),
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Failed to create in-app notification. Ensure the recipient user exists in your organization.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gym-100 text-gym-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create In-App Notification</h2>
              <p className="text-xs text-gray-500">
                Dispatch an in-app notification record to a specific recipient user
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
            {/* Branch Attribution */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Branch Location <span className="text-red-500">*</span>
              </label>
              {isLoadingBranches ? (
                <div className="text-xs text-gray-400 py-2">Loading active branches...</div>
              ) : (
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
                  required
                >
                  <option value="" disabled>Select attributing branch</option>
                  {activeBranches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Recipient Selection Mode */}
            <div className="col-span-full space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Recipient User Selection (Single In-App Recipient) <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientMode('self')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    recipientMode === 'self'
                      ? 'border-gym-500 bg-gym-50 text-gym-800 font-semibold ring-2 ring-gym-500/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5" />
                    <span>My Account</span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    Self / Admin test
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode('recent')}
                  disabled={recentRecipientIds.length === 0}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all disabled:opacity-40 ${
                    recipientMode === 'recent'
                      ? 'border-gym-500 bg-gym-50 text-gym-800 font-semibold ring-2 ring-gym-500/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Recent Recipient</span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    {recentRecipientIds.length > 0 ? `${recentRecipientIds.length} suggestions` : 'None yet'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode('manual')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    recipientMode === 'manual'
                      ? 'border-gym-500 bg-gym-50 text-gym-800 font-semibold ring-2 ring-gym-500/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>User ObjectId</span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    Manual 24-hex ID
                  </div>
                </button>
              </div>

              {/* Dynamic Recipient Input based on Mode */}
              {recipientMode === 'self' && (
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center justify-between">
                  <span>
                    Sending in-app test memo to authenticated administrator:{' '}
                    <strong className="text-gray-900">{user?.email || 'Admin'}</strong>
                  </span>
                  <span className="font-mono text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {user?.id}
                  </span>
                </div>
              )}

              {recipientMode === 'recent' && (
                <div>
                  <select
                    value={selectedRecentRecipient}
                    onChange={(e) => setSelectedRecentRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white"
                  >
                    {recentRecipientIds.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientMode === 'manual' && (
                <div>
                  <input
                    type="text"
                    value={manualRecipientId}
                    onChange={(e) => setManualRecipientId(e.target.value)}
                    placeholder="Enter 24-character hex User ObjectId (e.g. 6ac26a1bfcbf8d411bca8c0f)..."
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    User ObjectIds belong to registered user accounts in your organization. The backend verifies tenant ownership.
                  </p>
                </div>
              )}
            </div>

            {/* Type / Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category / Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white capitalize"
              >
                {COMMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {type === 'Other' && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Specify custom type..."
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500"
                  required
                />
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 bg-white capitalize"
              >
                <option value="low">Low (General informational)</option>
                <option value="medium">Medium (Standard update)</option>
                <option value="high">High (Urgent alert)</option>
              </select>
            </div>

            {/* Title / Headline */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Notification Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Change: Saturday Spin Class Rescheduled"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>

            {/* Message Body */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Message Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write the full in-app message text..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500"
                required
              />
            </div>
          </div>

          {/* Delivery Semantics Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Delivery Semantics:</strong> Submitting this form creates an in-app notification
              record visible in the recipient's in-app notification hub. It does not send external SMS,
              email, or push notifications. Notifications are immutable once dispatched.
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createNotificationMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNotificationMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gym-600 hover:bg-gym-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {createNotificationMutation.isPending ? 'Dispatching...' : 'Dispatch In-App Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
