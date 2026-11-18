import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo, BrandSpinner } from './BrandLogo';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface AdminLoginViewProps {
  onSuccess?: () => void;
  fullScreen?: boolean;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onSuccess,
  fullScreen = false,
}) => {
  const {
    loginWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    needsVerification,
    firebaseUser,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
    accessDeniedReason,
    clearAccessDenied,
  } = useAdminAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAccessDenied();
    setIsSubmitting(true);

    if (resetMode) {
      const res = await sendPasswordReset(email);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage(
          `Password reset link sent to ${email.trim()}. Check your work inbox and spam folder.`
        );
      } else {
        setErrorMessage(res.error || 'Could not send reset email.');
      }
      return;
    }

    const result = await loginWithEmail(email, password);
    setIsSubmitting(false);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAccessDenied();
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    setIsGoogleLoading(false);
    if (result.success && onSuccess) {
      onSuccess();
    } else if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleResendVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerifyBusy(true);
    const res = await resendVerificationEmail();
    setVerifyBusy(false);
    if (res.success) {
      setSuccessMessage(
        `Verification link sent to ${firebaseUser?.email}. Click the link in your inbox, then press "I've Verified".`
      );
    } else {
      setErrorMessage(res.error || 'Could not send verification email.');
    }
  };

  const handleCheckVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerifyBusy(true);
    const verified = await refreshVerificationStatus();
    setVerifyBusy(false);
    if (!verified) {
      setErrorMessage('Email is still unverified. Please click the verification link in your inbox first.');
    }
  };

  const displayError = accessDeniedReason || errorMessage;

  const content = needsVerification && firebaseUser ? (
    <div className="max-w-md mx-auto w-full py-8 px-4">
      <div className="text-center mb-6">
        <BrandLogo className="w-18 h-18 mx-auto mb-3 drop-shadow-sm" />
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-blue-800 dark:text-sky-400">Email Verification Required</span>
          <span aria-hidden="true">·</span>
          <span>AESL IT Department</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-2">
          Verify Your Work Email
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Signed in as <strong className="text-[#0B0F17] dark:text-white">{firebaseUser.email}</strong>. To protect company inventory, please verify your inbox once before accessing the portal.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B111B]/90 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none p-6 space-y-4">
        {displayError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-[#EFF6FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-start gap-2.5 text-blue-900 dark:text-sky-200 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="button"
          disabled={verifyBusy}
          onClick={handleCheckVerification}
          className="w-full py-3 px-4 bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-[#06090F] font-semibold text-sm rounded-full transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {verifyBusy ? <BrandSpinner size="xs" /> : <RefreshCw className="w-4 h-4" />}
          <span>I&apos;ve Verified — Enter Portal</span>
        </button>

        <button
          type="button"
          disabled={verifyBusy}
          onClick={handleResendVerification}
          className="w-full py-2.5 px-4 bg-[#EFF6FF] hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-900 dark:text-sky-300 font-semibold text-xs rounded-full border border-blue-200 dark:border-blue-500/30 transition cursor-pointer disabled:opacity-70"
        >
          Send Verification Email to Inbox
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out & Use Another Account</span>
        </button>
      </div>
    </div>
  ) : (
    <div className="max-w-md mx-auto w-full py-8 sm:py-12 px-4">
      <div className="text-center mb-7">
        <BrandLogo className="w-18 h-18 mx-auto mb-3 drop-shadow-sm" />
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-blue-800 dark:text-sky-400">Authorized IT Staff Portal</span>
          <span aria-hidden="true">·</span>
          <span>Anointed Engineering Services Ltd</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-2">
          {resetMode ? 'Reset Your Password' : 'Sign In to PrintFlow'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
          {resetMode
            ? 'Enter your AESL work email to receive a password reset link.'
            : 'Sign in with your assigned AESL work email and password to manage cartridge stock across all 27 locations.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B111B]/90 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-5">
          <div>
            <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
              {resetMode ? 'Password Recovery' : 'IT Team Sign In'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invite-only access · Cloud-synced across all devices
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {displayError && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Access Notice</p>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">{displayError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-[#EFF6FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-start gap-3 text-blue-900 dark:text-sky-200 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@anointedengineering.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-sm text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                autoComplete="email"
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-sm text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="pt-1 space-y-2.5">
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-3 px-4 bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-[#06090F] font-semibold text-sm rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <BrandSpinner size="xs" />
                  <span>{resetMode ? 'Sending Reset Link...' : 'Signing In...'}</span>
                </>
              ) : resetMode ? (
                <span>Send Password Reset Link</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In with Work Email</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {resetMode && (
              <button
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        {!resetMode && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 rounded-full text-xs font-semibold transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <>
                  <BrandSpinner size="xs" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>Continue with Google (Super Admin / Workspace)</span>
                </>
              )}
            </button>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Public sign-up disabled</span>
          <span>Firebase Cloud Security</span>
        </div>
      </div>
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#06090F] text-[#0B0F17] dark:text-slate-100 font-sans flex flex-col justify-center relative isolate">
      <div
        aria-hidden="true"
        className="hidden dark:block fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#040814] via-[#071226] to-[#080F20]" />
        <div
          className="dark-ambient-orb-a absolute -top-40 -left-24 w-[680px] h-[680px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(37,99,235,0.32) 0%, rgba(14,165,233,0.14) 45%, rgba(6,9,15,0) 72%)',
          }}
        />
        <div
          className="dark-ambient-orb-b absolute -bottom-48 -right-24 w-[760px] h-[760px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(30,58,138,0.22) 45%, rgba(6,9,15,0) 72%)',
          }}
        />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="fixed top-5 right-5 p-2.5 rounded-full bg-white/90 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/15 transition cursor-pointer z-20"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {content}
    </div>
  );
};
