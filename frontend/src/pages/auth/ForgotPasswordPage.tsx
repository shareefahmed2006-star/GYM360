import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ApiError, NetworkError } from '../../api/types';
import { Dumbbell, Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    resetToken?: string;
    resetUrl?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.forgotPassword(trimmedEmail);
      setSuccessInfo(result);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage('Too many password reset requests. Please wait a few minutes.');
        } else {
          setErrorMessage(err.message || 'Failed to process password reset request.');
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
          Forgot Password
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Enter your email to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-100">
          {successInfo ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Reset Instructions Generated</p>
                  <p className="mt-1 text-emerald-700 leading-relaxed">
                    {successInfo.message}
                  </p>
                </div>
              </div>

              {successInfo.resetUrl && (
                <div className="p-4 bg-gym-50 border border-gym-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-gym-900 font-semibold text-sm">
                    <KeyRound className="w-4 h-4 text-gym-600" />
                    <span>Direct Password Reset (Local Staging)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Because this system is running in local staging, you can proceed directly to reset your password without email delivery:
                  </p>
                  <Link
                    to={successInfo.resetUrl}
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-gym-600 text-white rounded-lg text-sm font-semibold hover:bg-gym-700 shadow-sm transition-all"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
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

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Registered Email Address
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
                <p className="mt-2 text-xs text-gray-500">
                  We'll verify your registered account and prepare a secure reset link.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gym-600 hover:bg-gym-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gym-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Reset Link...</span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gym-600 hover:text-gym-700"
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

export default ForgotPasswordPage;
