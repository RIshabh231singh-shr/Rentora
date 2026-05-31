import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ className = "", children, variant = "default", ...props }) {
  const variantClasses = {
    default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
    destructive: "border-transparent bg-red-500 text-zinc-50 hover:bg-red-500/80",
    outline: "text-zinc-950 border border-zinc-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant] || ""} ${className}`} {...props}>
      {children}
    </span>
  );
}

export function Button({ className = "", variant = "default", size = "default", children, ...props }) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
  const variantClasses = {
    default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow",
    destructive: "bg-red-500 text-zinc-50 hover:bg-red-500/90 shadow-sm",
    outline: "border border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-50",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 shadow-sm",
    ghost: "hover:bg-zinc-50 hover:text-zinc-900",
    link: "text-zinc-900 underline-offset-4 hover:underline",
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant] || ""} ${sizeClasses[size] || ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", type = "text", ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2b7fff] focus-visible:border-[#2b7fff] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
