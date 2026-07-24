import React from "react";

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
