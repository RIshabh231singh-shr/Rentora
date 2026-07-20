import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ===================================================
   GLASS CARD
   =================================================== */
export function GlassCard({ className = "", children, hover = false, ...props }) {
  return (
    <div
      className={`glass-card rounded-2xl ${hover ? "card-hover cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===================================================
   GRADIENT BUTTON
   =================================================== */
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

/* ===================================================
   STATUS BADGE
   =================================================== */
export function StatusBadge({ status }) {
  const map = {
    pending:       { label: "Pending",      cls: "badge-pending" },
    booked:        { label: "Booked",       cls: "badge-booked" },
    confirmed:     { label: "Confirmed",    cls: "badge-booked" },
    active:        { label: "Active",       cls: "badge-active" },
    checked_in:    { label: "Checked In",   cls: "badge-active" },
    in_progress:   { label: "In Progress",  cls: "badge-active" },
    assigned:      { label: "Assigned",     cls: "badge-booked" },
    completed:     { label: "Completed",    cls: "badge-success" },
    resolved:      { label: "Resolved",     cls: "badge-success" },
    cancelled:     { label: "Cancelled",    cls: "badge-danger" },
    rejected:      { label: "Rejected",     cls: "badge-danger" },
    checked_out:   { label: "Checked Out",  cls: "badge-neutral" },
    monthly:       { label: "Monthly",      cls: "badge-booked" },
    hourly:        { label: "Hourly",       cls: "badge-neutral" },
    available:     { label: "Available",    cls: "badge-success" },
    occupied:      { label: "Occupied",     cls: "badge-danger" },
    unread:        { label: "New",          cls: "badge-booked" },
    read:          { label: "Read",         cls: "badge-neutral" },
  };
  const { label, cls } = map[status?.toLowerCase?.()] || { label: status, cls: "badge-neutral" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/* ===================================================
   SKELETON LOADER
   =================================================== */
export function Skeleton({ className = "" }) {
  return (
    <div className={`bg-slate-200 shimmer rounded-xl ${className}`} />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <Skeleton className="h-52 rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 flex gap-3 border border-slate-100">
      <Skeleton className="size-11 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/* ===================================================
   EMPTY STATE
   =================================================== */
export function EmptyState({ icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center mb-5 text-slate-400 animate-bounce-in">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      {action && (
        <GradientButton onClick={action} size="md">
          {actionLabel || "Get Started"}
        </GradientButton>
      )}
    </div>
  );
}

/* ===================================================
   AVATAR
   =================================================== */
export function Avatar({ name, src, size = "md", className = "" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-xl", xl: "size-20 text-3xl" };
  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}

/* ===================================================
   STAT CARD
   =================================================== */
export function StatCard({ label, value, icon, change, color = "blue", loading = false }) {
  const colors = {
    blue:   { bar: "from-blue-500 to-blue-600",    bg: "bg-blue-50",   text: "text-blue-600",   icon: "bg-blue-100" },
    indigo: { bar: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600", icon: "bg-indigo-100" },
    cyan:   { bar: "from-cyan-500 to-cyan-600",    bg: "bg-cyan-50",   text: "text-cyan-600",   icon: "bg-cyan-100" },
    green:  { bar: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600", icon: "bg-emerald-100" },
    amber:  { bar: "from-amber-500 to-amber-600",  bg: "bg-amber-50",  text: "text-amber-600",  icon: "bg-amber-100" },
    red:    { bar: "from-red-500 to-red-600",      bg: "bg-red-50",    text: "text-red-600",    icon: "bg-red-100" },
  };
  const c = colors[color] || colors.blue;
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden card-hover">
      <div className={`stat-card-bar bg-gradient-to-r ${c.bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
          <p className={`text-3xl font-extrabold ${c.text} animate-count-up`}>{value}</p>
          {change && <p className="text-xs text-slate-400 mt-1">{change}</p>}
        </div>
        <div className={`${c.icon} rounded-xl p-3`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* ===================================================
   SEARCH INPUT
   =================================================== */
export function SearchInput({ placeholder = "Search...", value, onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        className="form-input pl-10"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/* ===================================================
   MODAL
   =================================================== */
export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer border-none transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===================================================
   TOAST NOTIFICATION
   =================================================== */
export function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-5 right-5 z-[300] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`pointer-events-auto flex items-start gap-3 bg-white rounded-2xl p-4 shadow-xl border max-w-sm w-full ${
              t.type === "success" ? "border-emerald-200" :
              t.type === "error"   ? "border-red-200" :
              "border-slate-100"
            }`}
          >
            <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
              t.type === "success" ? "bg-emerald-100 text-emerald-600" :
              t.type === "error"   ? "bg-red-100 text-red-600" :
              "bg-blue-100 text-blue-600"
            }`}>
              {t.type === "success" ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : t.type === "error" ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              {t.title && <p className="font-semibold text-slate-900 text-sm">{t.title}</p>}
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss?.(t.id)}
              className="size-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer border-none shrink-0"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ===================================================
   SECTION HEADER
   =================================================== */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ===================================================
   BADGE
   =================================================== */
export function Badge({ children, color = "blue", className = "" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-700",
    cyan: "bg-cyan-100 text-cyan-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.blue} ${className}`}>
      {children}
    </span>
  );
}

/* ===================================================
   DIVIDER
   =================================================== */
export function Divider({ className = "" }) {
  return <hr className={`border-slate-100 ${className}`} />;
}
