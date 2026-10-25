import React from 'react';
import { AlertCircle, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  type = 'error',
  onClose,
}) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
    },
  }[type];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-lg border ${styles.bg} ${styles.border} ${styles.text} text-sm transition-all`}
      role="alert"
    >
      {styles.icon}
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};
