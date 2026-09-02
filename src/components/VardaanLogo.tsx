import React from 'react';

interface VardaanLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  subtitle?: boolean;
}

export const VardaanLogo: React.FC<VardaanLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
  subtitle = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-3xl font-extrabold',
    xl: 'text-4xl font-extrabold',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* High-tech stylized gradient 'V' emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]}`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 opacity-60 blur-md dark:opacity-75 animate-pulse" />
        
        {/* SVG Container */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Main Gradient */}
            <linearGradient id="vMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="45%" stopColor="#8B5CF6" />
              <stop offset="75%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>

            {/* Cyan/Blue High-tech wing gradient */}
            <linearGradient id="vWingGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="60%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Rounded Shield */}
          <rect
            width="100"
            height="100"
            rx="26"
            className="fill-slate-900 dark:fill-slate-950 stroke-slate-700/50 dark:stroke-slate-800"
            strokeWidth="2"
          />

          {/* Left Wing of 'V' (Cyan to Blue) */}
          <path
            d="M22 28 L42 74 C45 80 49 84 50 84 C48 80 34 46 32 28 Z"
            fill="url(#vWingGradient)"
            opacity="0.95"
          />

          {/* Right Main Arch of 'V' (Purple to Pink Gradient) */}
          <path
            d="M78 28 L58 74 C55 80 51 84 50 84 C52 80 66 46 68 28 Z"
            fill="url(#vMainGradient)"
          />

          {/* Front Dynamic 'V' Chevron */}
          <path
            d="M26 30 L45 72 C48 78 52 78 55 72 L74 30 L62 30 L50 60 L38 30 Z"
            fill="url(#vMainGradient)"
            filter="url(#coreGlow)"
          />

          {/* Quantum AI Core Sparkle */}
          <circle cx="50" cy="34" r="5" fill="#38BDF8" className="animate-pulse" />
          <circle cx="50" cy="34" r="2.5" fill="#FFFFFF" />
          
          {/* Subtle Accent Nodes */}
          <circle cx="34" cy="46" r="2" fill="#818CF8" />
          <circle cx="66" cy="46" r="2" fill="#F472B6" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes[size]} ${textClassName} tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent font-sans`}
            >
              Vardaan AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              PRO
            </span>
          </div>
          {subtitle && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-normal">
              Your smart AI assistant
            </span>
          )}
        </div>
      )}
    </div>
  );
};
