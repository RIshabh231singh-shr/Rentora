import React from "react";

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
