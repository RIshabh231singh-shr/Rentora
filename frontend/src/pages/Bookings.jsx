import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Building2, Zap, ChevronDown, X,
  CheckCircle2, XCircle, MapPin, DollarSign, Users,
  ArrowUpRight, Filter, Search,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, EmptyState,
  Modal, SectionHeader, Badge, Skeleton, StatCard,
} from "../components/ui";
import api from "../utility/axiosInstance";

function BookingCard({ booking, onCancel, onView }) {
  const isProperty = !!booking.property;
  const name = booking.property?.propertyName || booking.amenity?.name || "Booking";
  const start = new Date(booking.bookingStartTime);
  const end = new Date(booking.bookingEndTime);
  const isUpcoming = start > new Date();
  const isActive = start <= new Date() && end >= new Date();
  const isPast = end < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView?.(booking)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
          isActive ? "bg-gradient-to-br from-blue-500 to-indigo-600" :
          isUpcoming ? "bg-gradient-to-br from-emerald-500 to-cyan-600" :
          "bg-slate-100"
        }`}>
          {isProperty
            ? <Building2 className={`size-5 ${isActive || isUpcoming ? "text-white" : "text-slate-400"}`} />
            : <Zap className={`size-5 ${isActive || isUpcoming ? "text-white" : "text-slate-400"}`} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-900 truncate">{name}</h3>
            <StatusBadge status={booking.status} />
          </div>
          {(booking.property?.propertyAddress || booking.property?.city) && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
              <MapPin className="size-3 shrink-0" />
              {booking.property?.city}, {booking.property?.state}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {isActive && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-600">Active now</span>
            </div>
          )}
        </div>

        {/* Cancel */}
        {(isUpcoming || isActive) && booking.status !== "cancelled" && booking.status !== "cancellation_requested" && (
          <button
            onClick={e => { e.stopPropagation(); onCancel?.(booking._id); }}
            className="size-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 cursor-pointer border-none transition-colors shrink-0"
            title="Cancel"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function BookingDetailModal({ booking, open, onClose }) {
  if (!booking) return null;
  const isProperty = !!booking.property;
  const name = booking.property?.propertyName || booking.amenity?.name || "Booking";
  const start = new Date(booking.bookingStartTime);
  const end = new Date(booking.bookingEndTime);
  const durationHours = Math.round((end - start) / (1000 * 60 * 60));
  const rate = booking.property?.pricePerHour || booking.amenity?.pricePerHour || 0;
  const total = isProperty && booking.property?.rentType === "monthly" ? rate : rate * durationHours;

  return (
    <Modal open={open} onClose={onClose} title="Booking Details" width="max-w-md">
      <div className="flex flex-col gap-4">
        {/* Status banner */}
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          booking.status === "booked" || booking.status === "confirmed" ? "bg-blue-50 border border-blue-200" :
          booking.status === "checked_in" ? "bg-emerald-50 border border-emerald-200" :
          booking.status === "cancelled" || booking.status === "rejected" ? "bg-red-50 border border-red-200" :
          "bg-slate-50 border border-slate-200"
        }`}>
          <StatusBadge status={booking.status} />
          <div>
            <p className="font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500 capitalize">{isProperty ? "Property Booking" : "Amenity Booking"}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Start Time", value: start.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
            { label: "End Time", value: end.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
            { label: "Duration", value: `${durationHours} hrs` },
            { label: "Rate", value: `₹${rate?.toLocaleString()}/hr` },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-50">
              <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #EFF6FF, #F0F4FF)" }}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-700">Total Amount</p>
            <p className="text-2xl font-extrabold text-blue-600">₹{total?.toLocaleString()}</p>
          </div>
        </div>

        {/* Property details */}
        {booking.property && (
          <div className="p-3.5 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Property</p>
            <p className="font-semibold text-slate-900">{booking.property.propertyName}</p>
            {booking.property.propertyAddress && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="size-3" />{booking.property.propertyAddress}, {booking.property.city}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

const TABS = ["all", "upcoming", "active", "past", "cancelled"];

export default function Bookings() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [viewBooking, setViewBooking] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/my");
      setBookings(res.data.bookings || res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchBookings(); }, [user]);

  const handleCancel = async (id) => {
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch {}
    setCancelId(null);
  };

  const { filtered, totalActive, totalUpcoming, totalPast } = useMemo(() => {
    const now = new Date();
    const filtered = bookings.filter(b => {
      const start = new Date(b.bookingStartTime);
      const end = new Date(b.bookingEndTime);
      if (tab === "all") return true;
      if (tab === "upcoming") return start > now && b.status !== "cancelled";
      if (tab === "active") return start <= now && end >= now;
      if (tab === "past") return end < now || b.status === "completed" || b.status === "checked_out";
      if (tab === "cancelled") return b.status === "cancelled" || b.status === "rejected";
      return true;
    });

    const totalActive = bookings.filter(b => { const s = new Date(b.bookingStartTime); const e = new Date(b.bookingEndTime); return s <= now && e >= now; }).length;
    const totalUpcoming = bookings.filter(b => new Date(b.bookingStartTime) > now && b.status !== "cancelled").length;
    const totalPast = bookings.filter(b => new Date(b.bookingEndTime) < now).length;

    return { filtered, totalActive, totalUpcoming, totalPast };
  }, [bookings, tab]);

  return (
    <Layout pageTitle="My Bookings">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">All your property and amenity reservations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard loading={loading} label="Active" value={totalActive} icon={<CheckCircle2 className="size-5" />} color="blue" />
          <StatCard loading={loading} label="Upcoming" value={totalUpcoming} icon={<Calendar className="size-5" />} color="green" />
          <StatCard loading={loading} label="Completed" value={totalPast} icon={<Clock className="size-5" />} color="indigo" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer border transition-all whitespace-nowrap ${
                tab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {t}
              {t !== "all" && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${tab === t ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {t === "upcoming" ? totalUpcoming : t === "active" ? totalActive : t === "past" ? totalPast : bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar className="size-8" />}
            title={`No ${tab === "all" ? "" : tab} bookings`}
            description={tab === "all" ? "Book a property or amenity to see your reservations here" : `You have no ${tab} bookings`}
            action={tab === "all" ? () => window.location.href = "/explore" : undefined}
            actionLabel="Browse Properties"
          />
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filtered.map(b => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  onCancel={setCancelId}
                  onView={setViewBooking}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cancel Confirm */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Booking" width="max-w-sm">
        <p className="text-slate-600 text-sm mb-5">Are you sure you want to cancel this booking? This may not be reversible.</p>
        <div className="flex gap-3">
          <GradientButton variant="danger" onClick={() => handleCancel(cancelId)} icon={<XCircle className="size-4" />}>Cancel Booking</GradientButton>
          <GradientButton variant="ghost" onClick={() => setCancelId(null)}>Keep it</GradientButton>
        </div>
      </Modal>

      {/* Detail modal */}
      <BookingDetailModal booking={viewBooking} open={!!viewBooking} onClose={() => setViewBooking(null)} />
    </Layout>
  );
}
