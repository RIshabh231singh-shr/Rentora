import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Calendar, Clock, Users, CheckCircle2, Star,
  Plus, ChevronLeft, ChevronRight, ArrowRight, Dumbbell,
  Waves, Trophy, Car, Building2, Coffee, Timer, X,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, EmptyState,
  Modal, SectionHeader, Badge, Skeleton, StatCard,
} from "../components/ui";
import { amenityService } from "../services/amenityService";
import { bookingService } from "../services/bookingService";

const AMENITY_ICONS = {
  gym: Dumbbell, pool: Waves, "swimming pool": Waves, tennis: Trophy, badminton: Trophy,
  parking: Car, club: Building2, conference: Building2, cafe: Coffee, default: Zap,
};

const getIcon = (name) => {
  const key = Object.keys(AMENITY_ICONS).find(k => name?.toLowerCase().includes(k));
  return AMENITY_ICONS[key] || AMENITY_ICONS.default;
};

const AMENITY_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
];

function AmenityCard({ amenity, idx, onBook, myBookings }) {
  const Icon = getIcon(amenity.name);
  const gradient = AMENITY_GRADIENTS[idx % AMENITY_GRADIENTS.length];
  const bookedCount = myBookings.filter(b => b.amenity?._id === amenity._id || b.amenity === amenity._id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
      onClick={() => onBook(amenity)}
    >
      <div className={`bg-gradient-to-br ${gradient} p-8 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="size-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="size-10 text-white" />
        </div>
        {bookedCount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] font-bold">
            {bookedCount} booked
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg mb-1">{amenity.name}</h3>
        <p className="text-slate-500 text-xs mb-3 capitalize">{amenity.category} · {amenity.property?.propertyName || "Property"}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 rounded-xl bg-slate-50 text-center">
            <p className="text-xs font-bold text-blue-600">₹{amenity.pricePerHour}/hr</p>
            <p className="text-[10px] text-slate-400">Rate</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 text-center">
            <p className="text-xs font-bold text-emerald-600">{amenity.capacity}</p>
            <p className="text-[10px] text-slate-400">Capacity</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 text-center">
            <p className="text-xs font-bold text-slate-700">{amenity.openingHour}:00</p>
            <p className="text-[10px] text-slate-400">Opens</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 text-center">
            <p className="text-xs font-bold text-slate-700">{amenity.closingHour}:00</p>
            <p className="text-[10px] text-slate-400">Closes</p>
          </div>
        </div>

        <GradientButton className="w-full" size="sm" icon={<Calendar className="size-3.5" />}>
          Book Slot
        </GradientButton>
      </div>
    </motion.div>
  );
}

function BookingSlot({ hour, isBooked, isStart, isEnd, inRange, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isBooked}
      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
        isBooked
          ? "bg-red-50 text-red-300 cursor-not-allowed"
          : isStart || isEnd
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
          : inRange
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {hour}:00
    </button>
  );
}

function AmenityBookingModal({ amenity, open, onClose, myBookings, onBooked }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [tab, setTab] = useState("book");

  const amenityBookings = myBookings.filter(b => (b.amenity?._id || b.amenity) === amenity?._id);

  useEffect(() => {
    if (!amenity || !date) return;
    bookingService.getSlotAvailability(amenity._id, date)
      .then(r => setBookedIntervals(r.bookedIntervals || []))
      .catch(() => {});
  }, [amenity, date]);

  if (!amenity) return null;
  const hours = Array.from({ length: amenity.closingHour - amenity.openingHour }, (_, i) => amenity.openingHour + i);
  const isBooked = (h) => bookedIntervals.some(b => h >= b.startHour && h < b.endHour);
  const isInRange = (h) => startHour !== null && endHour !== null && h >= startHour && h <= endHour;

  const handleHour = (h) => {
    if (startHour === null || (startHour !== null && endHour !== null)) { setStartHour(h); setEndHour(null); }
    else { h > startHour ? setEndHour(h) : setStartHour(h); }
  };

  const handleBook = async () => {
    if (startHour === null || endHour === null) {
      setMsg({ type: "error", text: "Select start and end hour." }); return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const s = new Date(date); s.setHours(startHour, 0, 0, 0);
      const e = new Date(date); e.setHours(endHour, 0, 0, 0);
      await bookingService.bookAmenity({ amenityId: amenity._id, bookingStartTime: s.toISOString(), bookingEndTime: e.toISOString() });
      setMsg({ type: "success", text: "🎉 Your booking request has been sent to the landlord." });
      setStartHour(null); setEndHour(null);
      onBooked?.();
      bookingService.getSlotAvailability(amenity._id, date)
        .then(r => setBookedIntervals(r.bookedIntervals || [])).catch(err => console.error("Availability error:", err));
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Booking failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={amenity.name} width="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          {["book", "my bookings"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold capitalize cursor-pointer border-none transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 bg-transparent"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "book" ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Rate", value: `₹${amenity.pricePerHour}/hr`, color: "text-blue-600" },
                { label: "Capacity", value: amenity.capacity, color: "text-emerald-600" },
                { label: "Hours", value: `${amenity.openingHour}–${amenity.closingHour}`, color: "text-indigo-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} min={new Date().toISOString().split("T")[0]} onChange={e => { setDate(e.target.value); setStartHour(null); setEndHour(null); }} />
            </div>

            <div>
              <p className="form-label">Select Time Slot <span className="text-slate-400 font-normal text-xs">(tap start then end)</span></p>
              <div className="flex flex-wrap gap-2 mt-2">
                {hours.map(h => (
                  <BookingSlot
                    key={h}
                    hour={h}
                    isBooked={isBooked(h)}
                    isStart={h === startHour}
                    isEnd={h === endHour}
                    inRange={isInRange(h)}
                    onClick={() => !isBooked(h) && handleHour(h)}
                  />
                ))}
              </div>
              {startHour !== null && endHour !== null && (
                <p className="text-xs text-blue-700 font-bold mt-2 p-2.5 bg-blue-50 rounded-xl">
                  Selected: {startHour}:00 → {endHour}:00 ({endHour - startHour} hrs · ₹{(endHour - startHour) * amenity.pricePerHour})
                </p>
              )}
            </div>

            {msg.text && (
              <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {msg.text}
              </div>
            )}

            <GradientButton onClick={handleBook} loading={loading} icon={<CheckCircle2 className="size-4" />}>
              Confirm Booking
            </GradientButton>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {amenityBookings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="size-6" />}
                title="No bookings yet"
                description="Book a slot to see it here"
              />
            ) : (
              amenityBookings.map(b => (
                <div key={b._id} className="p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Calendar className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{new Date(b.bookingStartTime).toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.bookingStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(b.bookingEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Amenities() {
  const [user, setUser] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingAmenity, setBookingAmenity] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [amenData, bookData] = await Promise.all([
        amenityService.getAmenities(),
        bookingService.getMyBookings(),
      ]);
      setAmenities(amenData.amenities || amenData || []);
      const allBookings = bookData.bookings || bookData || [];
      setMyBookings(allBookings.filter(b => b.amenity));
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const totalBooked = myBookings.filter(b => b.status === "booked" || b.status === "checked_in").length;
  const checkedIn = myBookings.filter(b => b.status === "checked_in").length;

  return (
    <Layout pageTitle="Amenities">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
        <div className="flex flex-wrap items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Amenities</h1>
            <p className="text-slate-500 text-sm mt-1">Book slots for gym, pool, courts, and more</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard loading={loading} label="Available" value={amenities.length} icon={<Zap className="size-5" />} color="blue" />
          <StatCard loading={loading} label="My Bookings" value={totalBooked} icon={<Calendar className="size-5" />} color="indigo" />
          <StatCard loading={loading} label="Active Now" value={checkedIn} icon={<CheckCircle2 className="size-5" />} color="green" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : amenities.length === 0 ? (
          <EmptyState
            icon={<Zap className="size-8" />}
            title="No amenities available"
            description="Your property amenities will appear here once added by your landlord"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {amenities.map((a, i) => (
              <AmenityCard
                key={a._id}
                amenity={a}
                idx={i}
                onBook={setBookingAmenity}
                myBookings={myBookings}
              />
            ))}
          </div>
        )}

        {myBookings.length > 0 && (
          <GlassCard className="mt-8 p-5">
            <SectionHeader title="My Recent Amenity Bookings" />
            <div className="flex flex-col divide-y divide-slate-50">
              {myBookings.slice(0, 5).map(b => (
                <div key={b._id} className="flex items-center gap-4 py-3">
                  <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Zap className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{b.amenity?.name || "Amenity"}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.bookingStartTime).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(b.bookingStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{new Date(b.bookingEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      <AmenityBookingModal
        amenity={bookingAmenity}
        open={!!bookingAmenity}
        onClose={() => setBookingAmenity(null)}
        myBookings={myBookings}
        onBooked={fetchAll}
      />
    </Layout>
  );
}
