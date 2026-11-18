import React, { useState } from 'react';

export const AESL_LOGO_SRC = '/assets/aistudio/AESL_IMAGE-removebg-preview_f49cf85c.png';

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  framed?: boolean;
  alt?: string;
}

/**
 * Official Anointed Engineering Services Limited (AESL) triangular emblem.
 * Uses a high-contrast subtle backing when framed, with automatic SVG fallback.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-10 h-10',
  imgClassName = 'w-full h-full object-contain',
  framed = false,
  alt = 'Anointed Engineering Services Limited Logo',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        framed
          ? 'bg-white dark:bg-white/95 rounded-xl p-1 border border-slate-200/80 dark:border-white/20 shadow-xs'
          : ''
      } ${className}`}
    >
      {!imgError ? (
        <img
          src={AESL_LOGO_SRC}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={imgClassName}
        />
      ) : (
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full"
          aria-label={alt}
        >
          <polygon
            points="32,6 58,54 6,54"
            fill="#0284C7"
            stroke="#DC2626"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <text
            x="32"
            y="45"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            AESL
          </text>
        </svg>
      )}
    </div>
  );
};

interface BrandSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Compact AESL logo loading icon with an orbital blue ring.
 * Suitable for buttons, inline async states, and header loading indicators.
 */
export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  size = 'sm',
  className = '',
}) => {
  const dimensions = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  }[size];

  const padding = {
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2.5',
  }[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${dimensions} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span
        aria-hidden="true"
        className="aesl-orbit-ring absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-600 border-r-sky-400 dark:border-sky-400/20 dark:border-t-sky-400 dark:border-r-blue-400"
      />
      <BrandLogo
        className={`w-full h-full ${padding} aesl-logo-breathe`}
        imgClassName="w-full h-full object-contain"
      />
    </span>
  );
};

interface BrandLoaderScreenProps {
  label?: string;
}

/**
 * Full-screen branded splash / loading screen showcasing the AESL logo loading icon.
 */
export const BrandLoaderScreen: React.FC<BrandLoaderScreenProps> = ({
  label = 'Loading AESL Fleet Portal...',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#06090F] transition-opacity duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative flex items-center justify-center w-28 h-28">
          <div
            aria-hidden="true"
            className="aesl-orbit-ring-slow absolute inset-0 rounded-full border-[3px] border-blue-100 dark:border-sky-500/15 border-t-blue-600 border-r-sky-500 dark:border-t-sky-400 dark:border-r-blue-500"
          />
          <div
            aria-hidden="true"
            className="aesl-orbit-ring-reverse absolute inset-2 rounded-full border-2 border-transparent border-b-rose-500/70 border-l-blue-400/50"
          />
          <div className="w-20 h-20 rounded-full bg-white/95 dark:bg-[#0B1220] shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center p-2.5">
            <BrandLogo
              className="w-full h-full aesl-logo-breathe"
              imgClassName="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Anointed Engineering Services Limited
          </p>
          <p className="text-xs font-medium text-blue-700 dark:text-sky-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};
