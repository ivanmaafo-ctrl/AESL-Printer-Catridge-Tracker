import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { BrandLogo, BrandSpinner } from './BrandLogo';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface AdminLoginViewProps {
  onSuccess?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess }) => {
  const { login } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = login(username, password);
      setIsSubmitting(false);

      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
      }
    }, 200);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-14 px-4">
      <div className="text-center mb-8">
        <BrandLogo className="w-18 h-18 mx-auto mb-3 drop-shadow-sm" />
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-blue-800 dark:text-sky-400">Secure Access Gateway</span>
          <span aria-hidden="true">·</span>
          <span>AESL IT Department</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-2">
          Master Admin Portal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Sign in with authorized administrator credentials to manage warehouse stock levels, branch allocations, and system configurations.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B111B]/90 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-white/10 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">Administrator Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Please provide your assigned credentials</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-sm text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-sm text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-[#06090F] font-semibold text-sm rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <BrandSpinner size="xs" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>AESL Security Active</span>
          <span>Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
