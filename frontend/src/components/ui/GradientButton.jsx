import React from "react";

export function GradientButton({ className = "", children, variant = "primary", size = "md", loading = false, icon, ...props }) {
  const sizes = {
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
    xl: "px-8 py-4 text-base",
  };
  const variants = {
    primary: "btn-primary",
    danger: "bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95",
    outline: "bg-white border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-150 active:scale-95",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-all duration-150 active:scale-95 border-none",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin-slow size-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
