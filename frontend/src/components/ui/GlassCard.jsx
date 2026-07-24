import React from "react";

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
