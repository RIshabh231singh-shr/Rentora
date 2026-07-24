import React from "react";

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
    cancellation_requested: { label: "Cancellation Requested", cls: "badge-pending" },
  };
  const { label, cls } = map[status?.toLowerCase?.()] || { label: status, cls: "badge-neutral" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
