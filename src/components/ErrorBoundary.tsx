import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AESL ErrorBoundary caught error:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let parsedError = this.state.message;
    try {
      const parsed = JSON.parse(this.state.message);
      if (parsed && typeof parsed.error === 'string') {
        parsedError = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
      }
    } catch {
      // plain string message
    }

    return (
      <div className="min-h-screen bg-white dark:bg-[#06090F] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#F6F8FC] dark:bg-[#0B111B] border border-slate-200 dark:border-white/15 rounded-3xl p-7 text-center space-y-4">
          <BrandLogo className="w-14 h-14 mx-auto" />
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-[#0B0F17] dark:text-white">
            Something interrupted your session
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
            {parsedError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Portal</span>
          </button>
        </div>
      </div>
    );
  }
}
