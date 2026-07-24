import React from "react";

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
