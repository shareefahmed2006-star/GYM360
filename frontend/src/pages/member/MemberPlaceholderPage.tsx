import React from 'react';
import { Layers } from 'lucide-react';

interface MemberPlaceholderPageProps {
  title: string;
  description: string;
}

export const MemberPlaceholderPage: React.FC<MemberPlaceholderPageProps> = ({
  title,
  description,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Member Section Ready</h3>
        <p className="text-xs text-gray-500 max-w-md mt-1">
          This portal section route is registered and isolated for member access. Full interactive member workflows will be connected in upcoming milestones.
        </p>
      </div>
    </div>
  );
};
