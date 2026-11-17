import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Shield,
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
      {/* Portal Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-3 ring-4 ring-blue-50">
          <Shield className="w-7 h-7" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
            Secure Access Gateway
          </span>
          <span className="text-xs font-mono text-slate-500">
            AESL · IT Dept
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2.5">
          Master Admin Portal
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Sign in with authorized administrator credentials to manage warehouse stock levels, branch allocations, and system configurations.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Administrator Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Please provide your assigned credentials</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>Authenticating Credentials...</span>
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

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>AESL Security Active</span>
          </span>
          <span>Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
