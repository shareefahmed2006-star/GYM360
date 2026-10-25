import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  X,
  Copy,
  Check,
  Calendar,
  User,
  Building2,
  FileCode2,
  Layers,
  Lock,
} from 'lucide-react';
import { AuditLogDocument } from '../../types/auditLog.types';

interface AuditLogDetailModalProps {
  log: AuditLogDocument | null;
  branchName?: string;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  branchName,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!log) return null;

  const handleCopy = async (text: string, key: string) => {
    setCopyError(null);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      setCopyError('Unable to access clipboard in this browser context.');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  // Semantic pill styling for action type
  const getActionBadge = (action: string) => {
    if (action.includes('CREATED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('STATUS')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('UPDATED')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('SECURITY') || action.includes('AUTH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Security Audit Event Details
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadge(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                ID: {log._id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clipboard feedback alert */}
        {copyError && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
            {copyError}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Narrative Summary */}
          <div className="space-y-1.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px] block">
              Event Description / Narrative
            </span>
            <p className="text-gray-900 font-medium text-xs leading-relaxed whitespace-pre-wrap">
              {log.description || 'No description recorded.'}
            </p>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timestamp */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-semibold flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Timestamp (UTC)
              </span>
              <p className="text-gray-900 font-bold font-mono text-xs">
                {log.createdAt}
              </p>
            </div>

            {/* Target Branch */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-semibold flex items-center gap-1.5 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Branch Location
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-900 font-semibold truncate">
                  {branchName || 'Unassigned / Org Scope'}
                </span>
                {log.branchId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(log.branchId, 'branchId')}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer"
                    title="Copy Branch ID"
                  >
                    {copiedKey === 'branchId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Entity Target */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-semibold flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                Affected Resource
              </span>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700 mr-1.5">
                    {log.entityType}
                  </span>
                  <span className="font-mono text-gray-800">
                    {log.entityId}
                  </span>
                </div>
                {log.entityId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(log.entityId, 'entityId')}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer"
                    title="Copy Entity ID"
                  >
                    {copiedKey === 'entityId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Actor User */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-semibold flex items-center gap-1.5 text-[11px]">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Responsible Actor (User ID)
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-gray-800 truncate">
                  {log.userId}
                </span>
                {log.userId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(log.userId, 'userId')}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer"
                    title="Copy Actor User ID"
                  >
                    {copiedKey === 'userId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Raw JSON Inspector */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="flex items-center gap-1.5 text-gym-700 hover:text-gym-900 font-semibold cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                {showRawJson ? 'Hide Raw Audit Document' : 'View Complete Audit Record (JSON)'}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(log, null, 2), 'rawJson')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-[11px] cursor-pointer"
              >
                {copiedKey === 'rawJson' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {showRawJson && (
              <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-gray-800 leading-relaxed">
                {JSON.stringify(log, null, 2)}
              </pre>
            )}
          </div>

          {/* Immutability Compliance Notice */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2.5 text-gray-600">
            <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Compliance Notice:</strong> Security audit logs are immutable, append-only records generated automatically by system activities. These records cannot be edited, altered, or purged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
