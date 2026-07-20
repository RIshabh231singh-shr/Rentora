import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Star, Users, Heart, X, SlidersHorizontal,
  Building2, Home, Zap, DollarSign, Calendar, Send, ChevronLeft,
  ChevronRight, Clock, CheckCircle2,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, PropertyCardSkeleton,
  EmptyState, Modal, SearchInput, Badge, Avatar,
} from "../components/ui";
import api from "../utility/axiosInstance";

const PROPERTY_TYPES = ["All", "house", "villa", "gym", "swimmingpool", "commercial", "other"];
const RENT_TYPES = ["All", "monthly", "hourly"];

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`size-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
        />
      ))}
      {rating > 0 && <span className="text-xs text-slate-500 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}

function PropertyCard({ property, user, onView, onFavorite, isFav }) {
  const isOwner = property.owner?._id === user?.id || property.owner === user?.id;
  const isTenant = property.tenants?.some(t => t.toString() === user?.id);
  const hasPending = property.pendingTenants?.some(t => t.toString() === user?.id);
  const isFull = property.tenants?.length >= property.capacity;
  const priceLabel = property.rentType === "monthly" ? "/mo" : "/hr";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
      onClick={() => onView(property)}
    >
      {/* Image */}
      <div className="relative overflow-hidden h-52">
        <img
          src={property.images?.[0] || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80`}
          alt={property.propertyName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", color: "#1E293B" }}>
            {property.propertyType}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <button
            onClick={e => { e.stopPropagation(); onFavorite(property._id); }}
            className="size-8 rounded-full flex items-center justify-center cursor-pointer border-none transition-all"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}
          >
            <Heart className={`size-4 ${isFav ? "fill-red-500 text-red-500" : "text-slate-600"}`} />
          </button>
        </div>
        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: "rgba(37,99,235,0.9)", backdropFilter: "blur(8px)", color: "white" }}>
            ₹{property.pricePerHour?.toLocaleString()}{priceLabel}
          </span>
        </div>
        {isOwner && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-white">Your property</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-base truncate">{property.propertyName}</h3>
        <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
          <MapPin className="size-3 shrink-0" />
          {property.propertyAddress}, {property.city}
        </p>
        <div className="flex items-center justify-between mt-3">
          <StarRating rating={property.ratings} />
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="size-3" />
            {property.tenants?.length || 0}/{property.capacity}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex gap-1.5">
            <Badge color={property.rentType === "monthly" ? "blue" : "indigo"}>
              {property.rentType}
            </Badge>
            {isFull && <Badge color="red">Full</Badge>}
            {isTenant && <Badge color="green">Residing</Badge>}
            {hasPending && <Badge color="amber">Pending</Badge>}
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline">View →</span>
        </div>
      </div>
    </motion.div>
  );
}

function HourPicker({ openingHour, closingHour, bookedIntervals, startHour, endHour, onSelect }) {
  const hours = Array.from({ length: closingHour - openingHour }, (_, i) => openingHour + i);
  const isBooked = (h) => bookedIntervals.some(b => h >= b.startHour && h < b.endHour);
  const isInRange = (h) => startHour !== null && endHour !== null && h >= startHour && h <= endHour;
  const isStart = (h) => h === startHour;
  const isEnd = (h) => h === endHour;

  return (
    <div className="flex flex-wrap gap-1.5">
      {hours.map(h => {
        const booked = isBooked(h);
        const inRange = isInRange(h);
        const start = isStart(h);
        const end = isEnd(h);
        return (
          <button
            key={h}
            onClick={() => !booked && onSelect(h)}
            disabled={booked}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              booked ? "bg-red-50 text-red-300 cursor-not-allowed line-through" :
              start || end ? "bg-blue-600 text-white" :
              inRange ? "bg-blue-100 text-blue-700" :
              "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {h}:00
          </button>
        );
      })}
    </div>
  );
}

export default function FindProperties() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [rentFilter, setRentFilter] = useState("All");
  const [favorites, setFavorites] = useState(new Set());
  const [viewProp, setViewProp] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  // Booking states
  const [isBookingMonthly, setIsBookingMonthly] = useState(false);
  const [isBookingHourly, setIsBookingHourly] = useState(false);
  const [leaseDuration, setLeaseDuration] = useState(1);
  const [leaseStart, setLeaseStart] = useState(new Date().toISOString().split("T")[0]);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get("/properties");
      if (res.data.success) setProperties(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchProperties(); }, [user]);

  const fetchAvailability = async (propId, date) => {
    try {
      const d = date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
        : date;
      const res = await api.get(`/bookings/property/${propId}/availability`, { params: { date: d } });
      setBookedIntervals(res.data.bookedIntervals || []);
    } catch {}
  };

  const openView = (property) => {
    setViewProp(property);
    setActiveImg(0);
    setBookingMsg({ type: "", text: "" });
    setStartHour(null);
    setEndHour(null);
  };

  const handleToggleFav = (id) => {
    setFavorites(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleMonthlyBook = async () => {
    setBookingLoading(true);
    setBookingMsg({ type: "", text: "" });
    try {
      const res = await api.post("/bookings/property/book", {
        propertyId: viewProp._id,
        durationMonths: Number(leaseDuration),
        startDate: leaseStart,
      });
      if (res.data.success) {
        setBookingMsg({ type: "success", text: "🎉 Lease request sent! Waiting for owner approval." });
        setIsBookingMonthly(false);
        fetchProperties();
      } else {
        setBookingMsg({ type: "error", text: res.data.message || "Request failed." });
      }
    } catch (err) {
      setBookingMsg({ type: "error", text: err.response?.data?.message || "Failed to send request." });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleHourlyBook = async () => {
    if (startHour === null || endHour === null) {
      setBookingMsg({ type: "error", text: "Please select both start and end hours." });
      return;
    }
    setBookingLoading(true);
    setBookingMsg({ type: "", text: "" });
    try {
      const startTime = new Date(bookingDate);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(bookingDate);
      endTime.setHours(endHour, 0, 0, 0);
      const res = await api.post("/bookings/property/book", {
        propertyId: viewProp._id,
        bookingStartTime: startTime.toISOString(),
        bookingEndTime: endTime.toISOString(),
      });
      if (res.data.success) {
        setBookingMsg({ type: "success", text: "🎉 Booking confirmed!" });
        setStartHour(null);
        setEndHour(null);
        fetchAvailability(viewProp._id, bookingDate);
      } else {
        setBookingMsg({ type: "error", text: res.data.message });
      }
    } catch (err) {
      setBookingMsg({ type: "error", text: err.response?.data?.message || "Booking failed." });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleHourSelect = (h) => {
    if (startHour === null || (startHour !== null && endHour !== null)) {
      setStartHour(h); setEndHour(null);
    } else {
      if (h > startHour) setEndHour(h);
      else { setStartHour(h); setEndHour(null); }
    }
  };

  // Filtered properties
  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.propertyName?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.propertyAddress?.toLowerCase().includes(q);
    const matchType = typeFilter === "All" || p.propertyType === typeFilter;
    const matchRent = rentFilter === "All" || p.rentType === rentFilter;
    return matchSearch && matchType && matchRent;
  });

  const viewPropOwner = viewProp?.owner;
  const isOwner = viewPropOwner && (viewPropOwner._id === user?.id || viewPropOwner === user?.id);
  const isTenant = viewProp?.tenants?.some(t => t.toString() === user?.id);
  const hasPending = viewProp?.pendingTenants?.some(t => t.toString() === user?.id);
  const isFull = viewProp && viewProp.tenants?.length >= viewProp.capacity;

  return (
    <Layout pageTitle="Browse Properties">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Hero search bar */}
        <div className="relative rounded-3xl overflow-hidden mb-8 p-8"
          style={{ background: "linear-gradient(135deg, #0F172A, #1E3A8A 50%, #0F172A)" }}>
          <div className="blob w-64 h-64 bg-blue-500/20 -top-10 right-10 animate-blob" />
          <div className="blob w-40 h-40 bg-cyan-500/15 bottom-0 left-20 animate-blob" style={{ animationDelay: "3s" }} />
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-2">Find Your Perfect Space</h1>
            <p className="text-slate-400 mb-6">Discover properties, villas, gyms, and more</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur text-slate-900 placeholder-slate-400 font-medium outline-none border-none text-sm"
                  placeholder="Search by name, city, or address..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm cursor-pointer border border-white/20 transition-colors"
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-5 mb-6">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Property Type</p>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all capitalize ${typeFilter === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Rent Type</p>
                    <div className="flex gap-2">
                      {RENT_TYPES.map(t => (
                        <button key={t} onClick={() => setRentFilter(t)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all capitalize ${rentFilter === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-600 text-sm font-medium">
            {loading ? "Loading properties..." : `${filtered.length} properties found`}
          </p>
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-8" />}
            title="No properties found"
            description="Try adjusting your search or filters to discover more spaces"
            action={() => { setSearch(""); setTypeFilter("All"); setRentFilter("All"); }}
            actionLabel="Clear Filters"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => (
              <PropertyCard
                key={p._id}
                property={p}
                user={user}
                onView={openView}
                onFavorite={handleToggleFav}
                isFav={favorites.has(p._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      <Modal
        open={!!viewProp}
        onClose={() => { setViewProp(null); setIsBookingMonthly(false); setIsBookingHourly(false); setBookingMsg({ type: "", text: "" }); }}
        title={viewProp?.propertyName || ""}
        width="max-w-2xl"
      >
        {viewProp && (
          <div className="flex flex-col gap-5 -mt-2">
            {/* Image gallery */}
            <div className="relative rounded-xl overflow-hidden h-64 bg-slate-100">
              <img
                src={viewProp.images?.[activeImg] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"}
                alt={viewProp.propertyName}
                className="w-full h-full object-cover"
              />
              {viewProp.images?.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + viewProp.images.length) % viewProp.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 flex items-center justify-center cursor-pointer border-none shadow">
                    <ChevronLeft className="size-5 text-slate-700" />
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % viewProp.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 flex items-center justify-center cursor-pointer border-none shadow">
                    <ChevronRight className="size-5 text-slate-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {viewProp.images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`rounded-full border-none cursor-pointer transition-all ${i === activeImg ? "size-2 bg-white" : "size-1.5 bg-white/60"}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1.5 rounded-full font-bold text-sm text-white" style={{ background: "rgba(37,99,235,0.9)", backdropFilter: "blur(8px)" }}>
                  ₹{viewProp.pricePerHour?.toLocaleString()}/{viewProp.rentType === "monthly" ? "mo" : "hr"}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewProp.propertyName}</h3>
                <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="size-4 text-blue-500" />
                  {viewProp.propertyAddress}, {viewProp.city}, {viewProp.state} {viewProp.pincode}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge status={viewProp.rentType} />
                <StatusBadge status={isFull ? "occupied" : "available"} />
              </div>
            </div>

            {/* Owner */}
            {viewPropOwner?.firstname && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar name={`${viewPropOwner.firstname} ${viewPropOwner.lastname}`} size="md" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{viewPropOwner.firstname} {viewPropOwner.lastname}</p>
                  <p className="text-xs text-slate-500">{viewPropOwner.email}</p>
                </div>
                <Badge color="blue" className="ml-auto">Owner</Badge>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">About this property</p>
              <p className="text-slate-600 text-sm leading-relaxed">{viewProp.description}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Capacity", value: `${viewProp.capacity} people`, icon: Users },
                { label: "Security Deposit", value: `₹${viewProp.securityDeposit?.toLocaleString()}`, icon: DollarSign },
                { label: viewProp.rentType === "monthly" ? "Tenants" : "Hours", value: viewProp.rentType === "monthly" ? `${viewProp.tenants?.length || 0}/${viewProp.capacity}` : `${viewProp.openingHour}:00 - ${viewProp.closingHour}:00`, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Icon className="size-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-900">{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {viewProp.amenities?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewProp.amenities.map(a => <Badge key={a} color="cyan">{a}</Badge>)}
                </div>
              </div>
            )}

            {/* Booking form */}
            {bookingMsg.text && (
              <div className={`p-3.5 rounded-xl text-sm font-medium ${bookingMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {bookingMsg.text}
              </div>
            )}

            {/* Monthly booking form */}
            {isBookingMonthly && !isOwner && !isTenant && !hasPending && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col gap-3">
                <p className="font-semibold text-blue-900 text-sm">Monthly Lease Request</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Duration (months)</label>
                    <input type="number" className="form-input" min={1} max={24} value={leaseDuration} onChange={e => setLeaseDuration(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <GradientButton onClick={handleMonthlyBook} loading={bookingLoading} icon={<Send className="size-4" />}>
                    Send Request
                  </GradientButton>
                  <GradientButton variant="ghost" onClick={() => setIsBookingMonthly(false)}>Cancel</GradientButton>
                </div>
              </div>
            )}

            {/* Hourly booking form */}
            {isBookingHourly && !isOwner && !isTenant && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col gap-3">
                <p className="font-semibold text-indigo-900 text-sm">Hourly Slot Booking</p>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingDate instanceof Date ? bookingDate.toISOString().split("T")[0] : bookingDate}
                    onChange={e => {
                      const d = new Date(e.target.value);
                      setBookingDate(d);
                      fetchAvailability(viewProp._id, d);
                      setStartHour(null); setEndHour(null);
                    }}
                  />
                </div>
                <div>
                  <p className="form-label">Select Time Range <span className="text-slate-400 font-normal">(click start, then end)</span></p>
                  <HourPicker
                    openingHour={viewProp.openingHour || 8}
                    closingHour={viewProp.closingHour || 22}
                    bookedIntervals={bookedIntervals}
                    startHour={startHour}
                    endHour={endHour}
                    onSelect={handleHourSelect}
                  />
                  {startHour !== null && endHour !== null && (
                    <p className="text-xs text-blue-700 font-semibold mt-2">Selected: {startHour}:00 → {endHour}:00</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <GradientButton onClick={handleHourlyBook} loading={bookingLoading} icon={<CheckCircle2 className="size-4" />}>
                    Confirm Booking
                  </GradientButton>
                  <GradientButton variant="ghost" onClick={() => setIsBookingHourly(false)}>Cancel</GradientButton>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              {isOwner ? (
                <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">Your Property</span>
              ) : isTenant ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold">✓ You Reside Here</span>
              ) : hasPending ? (
                <span className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 text-sm font-semibold">⏳ Request Pending Approval</span>
              ) : isFull && viewProp.rentType === "monthly" ? (
                <span className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-semibold">Fully Occupied</span>
              ) : !isBookingMonthly && !isBookingHourly && (
                <>
                  {viewProp.rentType === "monthly" && (
                    <GradientButton onClick={() => setIsBookingMonthly(true)} icon={<Send className="size-4" />}>
                      Request to Rent
                    </GradientButton>
                  )}
                  {viewProp.rentType === "hourly" && (
                    <GradientButton onClick={() => {
                      setIsBookingHourly(true);
                      setBookingDate(new Date());
                      fetchAvailability(viewProp._id, new Date());
                    }} icon={<Calendar className="size-4" />}>
                      Book a Slot
                    </GradientButton>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
