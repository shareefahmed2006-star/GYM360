import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ApiError, NetworkError } from '../../api/types';
import { Dumbbell, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Password reset token is missing from the link. Please request a new reset link.');
      return;
    }

    if (!isFormValid) {
      setErrorMessage('Please ensure your new password satisfies all security requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setErrorMessage(err.message || 'The reset link is invalid or has expired. Please request a new one.');
        } else {
          setErrorMessage(err.message || 'Failed to reset password.');
        }
      } else if (err instanceof NetworkError) {
        setErrorMessage('Unable to connect to the GYM360 server. Please ensure the backend is running.');
      } else {
        setErrorMessage(err?.message || 'An unexpected error occurred.');
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
          Set New Password
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Create a strong password for your GYM360 account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-100">
          {!token ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-left">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Missing Reset Token</p>
                  <p className="mt-1 text-amber-700">
                    No reset token was found in the URL. Please request a new password reset link.
                  </p>
                </div>
              </div>
              <Link
                to="/forgot-password"
                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-gym-600 text-white rounded-lg text-sm font-semibold hover:bg-gym-700 transition-all"
              >
                <span>Request Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-left">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Password Reset Complete!</p>
                  <p className="mt-1 text-emerald-700">
                    Your password has been securely updated. You can now log in with your new credentials.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gym-600 text-white rounded-lg text-sm font-semibold hover:bg-gym-700 transition-all cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {errorMessage && (
                <ErrorAlert
                  type="error"
                  message={errorMessage}
                  onClose={() => setErrorMessage(null)}
                />
              )}

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <div className="mt-2 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 h-5" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 text-sm text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-2 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 h-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-500 focus:border-gym-500 text-sm text-gray-900"
                  />
                </div>
              </div>

              {/* Password Requirement Checklist */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
                <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasDigit ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  <span>At least one numeric digit (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gym-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
