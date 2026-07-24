import React from "react";
import { GradientButton } from "./GradientButton";

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
