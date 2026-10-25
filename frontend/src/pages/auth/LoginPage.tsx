import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ApiError, NetworkError } from '../../api/types';
import { Dumbbell, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect straight to role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'trainer') {
        navigate('/trainer/dashboard', { replace: true });
      } else {
        navigate('/member/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Check for session expiration flag on landing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setSessionExpiredNotice('Your session has expired. Please log in again.');
      // Remove query param cleanly
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSessionExpiredNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email: trimmedEmail, password });
      // Redirect based on role
      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (loggedInUser.role === 'trainer') {
        navigate('/trainer/dashboard', { replace: true });
      } else {
        navigate('/member/dashboard', { replace: true });
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setErrorMessage('Invalid email or password. Please check your credentials.');
        } else if (err.statusCode === 429) {
          setErrorMessage('Too many login attempts. Please try again after 15 minutes.');
        } else {
          setErrorMessage(err.message || 'Login failed. Please try again.');
        }
      } else if (err instanceof NetworkError) {
        setErrorMessage('Unable to connect to the GYM360 server. Please ensure the backend is running.');
      } else {
        setErrorMessage(err?.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gym-600 text-white shadow-lg mb-4">
          <Dumbbell className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          GYM<span className="text-gym-500">360</span>
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Enterprise Gym Management & Member Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {sessionExpiredNotice && (
              <ErrorAlert
                type="warning"
                message={sessionExpiredNotice}
                onClose={() => setSessionExpiredNotice(null)}
              />
            )}

            {errorMessage && (
              <ErrorAlert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="mt-2 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-gym-600 hover:text-gym-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-2 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 text-sm text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gym-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <p className="text-xs text-gray-500">
              Need account access? Contact your branch administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
