import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  let destination = '/login';
  if (isAuthenticated && user) {
    destination = user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Page Not Found</h1>
        <p className="text-sm text-gray-500 mt-2">
          The requested page could not be found on the GYM360 portal.
        </p>

        <div className="mt-6">
          <Link
            to={destination}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};
