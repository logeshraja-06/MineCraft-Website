import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

  const variants = {
    primary: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white font-black shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.65)] border border-purple-400/40 focus:ring-purple-400",
    secondary: "bg-[#0D0F18]/80 hover:bg-[#161926] text-purple-200 border border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] focus:ring-purple-500",
    portal: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white font-black shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_45px_rgba(168,85,247,0.8)] border border-purple-400/50 focus:ring-purple-400",
    portalOutline: "bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/50 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] focus:ring-purple-400",
    emerald: "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.35)] focus:ring-emerald-400 border border-emerald-400/40",
    danger: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-[0_0_20px_rgba(244,63,94,0.35)] focus:ring-rose-500 border border-rose-400/30",
    ghost: "bg-transparent hover:bg-purple-950/30 text-purple-200 hover:text-white focus:ring-purple-500",
    cyber: "bg-[#0D0F18]/90 hover:bg-[#161A29] text-purple-200 border border-purple-500/40 hover:border-purple-400 font-mono shadow-[0_0_20px_rgba(168,85,247,0.2)] focus:ring-purple-400",
    outline: "bg-transparent hover:bg-purple-950/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 font-mono focus:ring-purple-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </button>
  );
}
