import React from "react";
import { StatCardSkeleton } from "./Skeleton";

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
