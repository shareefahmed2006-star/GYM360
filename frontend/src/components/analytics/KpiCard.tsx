import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'purple' | 'amber';
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  badge,
}) => {
  const colorMap = {
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
  }[color];

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  }[badge?.variant ?? 'neutral'];

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorMap.bg} ${colorMap.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {badge && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeStyles}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};
