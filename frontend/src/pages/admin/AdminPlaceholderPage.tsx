import React from 'react';
import { Layers } from 'lucide-react';

interface AdminPlaceholderPageProps {
  title: string;
  description: string;
}

export const AdminPlaceholderPage: React.FC<AdminPlaceholderPageProps> = ({
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
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Module Scaffolding Ready</h3>
        <p className="text-xs text-gray-500 max-w-md mt-1">
          This operational section route is registered and protected. Full interactive management views will be integrated in subsequent milestones.
        </p>
      </div>
    </div>
  );
};
