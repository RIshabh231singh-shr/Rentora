import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench, Calendar, Building2, Home, ArrowRight, Clock,
  CheckCircle2, AlertCircle, Zap, TrendingUp, Bell,
  Plus, MapPin, Star, Users, Search, User
} from "lucide-react";
import Layout from "../components/Layout";
import { StatCard, GlassCard, StatusBadge, ListItemSkeleton, EmptyState, GradientButton, Avatar, SectionHeader } from "../components/ui";
import api from "../utility/axiosInstance";

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to} className="no-underline">
      <motion.div
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`glass-card rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer text-center`}
      >
        <div className={`size-11 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="size-5 text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </motion.div>
    </Link>
  );
}

function BookingCard({ booking }) {
  const property = booking?.property;
  const amenity = booking?.amenity;
  const name = property?.propertyName || amenity?.name || "Booking";
  const start = new Date(booking.bookingStartTime);
  const end = new Date(booking.bookingEndTime);
  const isToday = start.toDateString() === new Date().toDateString();

  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-start gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
        {amenity ? <Zap className="size-4 text-white" /> : <Building2 className="size-4 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {isToday ? "Today" : start.toLocaleDateString([], { month: "short", day: "numeric" })} · {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        {property?.city && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{property.city}</p>}
      </div>
      <StatusBadge status={booking.status} />
    </motion.div>
  );
}

function MaintenanceCard({ req }) {
  const statusColors = {
    pending: "text-amber-600 bg-amber-50",
    assigned: "text-blue-600 bg-blue-50",
    in_progress: "text-cyan-600 bg-cyan-50",
    resolved: "text-emerald-600 bg-emerald-50",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${statusColors[req.status] || "bg-slate-100 text-slate-500"}`}>
        <Wrench className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{req.title}</p>
        <p className="text-xs text-slate-500 capitalize mt-0.5">{req.category} · {req.status?.replace("_", " ")}</p>
      </div>
      <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
    </div>
  );
}

function PendingCard({ booking, onApprove, onReject }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50">
      <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <Clock className="size-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {booking.user?.firstname} {booking.user?.lastname}
        </p>
        <p className="text-xs text-slate-500 truncate">{booking.property?.propertyName}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onReject(booking._id)} className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors">Decline</button>
        <button onClick={() => onApprove(booking._id)} className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg border-none cursor-pointer transition-colors">Accept</button>
      </div>
    </div>
  );
}

function PropertyRentalCard({ property }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="size-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.propertyName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Building2 className="size-5 text-slate-400" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{property.propertyName}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="size-3" />{property.city}, {property.state}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-blue-600">₹{property.pricePerHour?.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">/{property.rentType === "monthly" ? "mo" : "hr"}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, kpiRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/maintenance/kpi").catch(() => ({ data: { data: null } }))
      ]);
      setData(dashRes.data);
      setKpi(kpiRes.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleApprove = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/approve`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to approve."); }
  };
  const handleReject = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to reject."); }
  };
  const handleApproveLease = async (propertyId, tenantId) => {
    try {
      await api.post(`/properties/${propertyId}/tenants/${tenantId}/accept`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to approve lease."); }
  };
  const handleRejectLease = async (propertyId, tenantId) => {
    try {
      await api.post(`/properties/${propertyId}/tenants/${tenantId}/reject`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || "Failed to reject lease."); }
  };

  const stats = data?.stats;
  const isLandlord = user?.role === "landlord" || user?.role === "admin";

  return (
    <Layout pageTitle="Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">

        {/* Hero Header */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 p-5 sm:p-8 md:p-10"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0C1A3A 100%)" }}>
          {/* Blobs */}
          <div className="blob w-40 sm:w-56 h-40 sm:h-56 bg-blue-500/20 -top-10 -right-10 animate-blob" />
          <div className="blob w-32 sm:w-40 h-32 sm:h-40 bg-indigo-500/15 bottom-0 right-32 animate-blob" style={{ animationDelay: "2s" }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white break-words">
                {greet()}, {user?.firstname} 👋
              </h1>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm max-w-md">
                {isLandlord
                  ? "Here's an overview of your properties and incoming requests today."
                  : "Here's a summary of your rentals, bookings, and maintenance."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
              <Link to="/explore">
                <GradientButton size="md" icon={<Search className="size-4" />} className="rounded-xl">
                  Browse Properties
                </GradientButton>
              </Link>
              <Link to="/maintenance">
                <GradientButton variant="outline" size="md" className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                  + Maintenance
                </GradientButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger-children">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatCard loading={loading} label="Active Requests" value={stats?.activeRequests ?? 0} icon={<Wrench className="size-5" />} color="amber" change="Maintenance open" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard loading={loading} label="Upcoming Bookings" value={stats?.upcomingBookings ?? 0} icon={<Calendar className="size-5" />} color="blue" change="Scheduled" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatCard loading={loading} label="Resolved" value={stats?.completedRequests ?? 0} icon={<CheckCircle2 className="size-5" />} color="green" change="Maintenance done" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard loading={loading} label="Amenity Bookings" value={stats?.amenityBookings ?? 0} icon={<Zap className="size-5" />} color="indigo" change="Total booked" />
          </motion.div>
        </div>

        {/* KPI Widgets */}
        {kpi && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-5 border"
              style={{ background: kpi.completionRate >= 90 ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "linear-gradient(135deg,#fffbeb,#fef3c7)", borderColor: kpi.completionRate >= 90 ? "#a7f3d0" : "#fde68a" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: kpi.completionRate >= 90 ? "#059669" : "#d97706" }}>Completion Rate</p>
              <p className="text-3xl font-extrabold" style={{ color: kpi.completionRate >= 90 ? "#047857" : "#b45309" }}>{kpi.completionRate}%</p>
              <p className="text-xs mt-1" style={{ color: kpi.completionRate >= 90 ? "#065f46" : "#92400e" }}>{kpi.resolved}/{kpi.total} resolved</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-5 border bg-slate-50 border-slate-200"
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">Request Breakdown</p>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between items-center"><span className="text-xs text-slate-600">Pending</span><span className="text-xs font-bold text-amber-600">{kpi.pending}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-slate-600">In Progress</span><span className="text-xs font-bold text-blue-600">{kpi.inProgress}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-slate-600">Resolved</span><span className="text-xs font-bold text-emerald-600">{kpi.resolved}</span></div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <GlassCard className="mb-6 sm:mb-8 p-4 sm:p-5">
          <SectionHeader title="Quick Actions" subtitle="Jump to the most common tasks" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            <QuickAction icon={Search} label="Browse" to="/explore" color="bg-gradient-to-br from-blue-500 to-blue-600" />
            <QuickAction icon={Calendar} label="Bookings" to="/bookings" color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
            <QuickAction icon={Wrench} label="Maintenance" to="/maintenance" color="bg-gradient-to-br from-amber-500 to-amber-600" />
            <QuickAction icon={Zap} label="Amenities" to="/amenities" color="bg-gradient-to-br from-cyan-500 to-cyan-600" />
            <QuickAction icon={Bell} label="Notifications" to="/notifications" color="bg-gradient-to-br from-red-500 to-pink-600" />
            <QuickAction icon={User} label="Profile" to="/profile" color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          </div>
        </GlassCard>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Upcoming Bookings */}
            <GlassCard className="p-5">
              <SectionHeader
                title="Upcoming Bookings"
                subtitle="Your scheduled bookings"
                action={<Link to="/bookings" className="text-xs text-blue-600 font-semibold hover:text-blue-700 no-underline flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>}
              />
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[1,2,3].map(i => <ListItemSkeleton key={i} />)}
                </div>
              ) : !data?.upcomingBookingsList?.length ? (
                <EmptyState
                  icon={<Calendar className="size-8" />}
                  title="No upcoming bookings"
                  description="Book a property or amenity to see it here"
                  action={() => window.location.href = "/explore"}
                  actionLabel="Browse Properties"
                />
              ) : (
                <div className="flex flex-col divide-y divide-slate-50">
                  {data.upcomingBookingsList.map(b => <BookingCard key={b._id} booking={b} />)}
                </div>
              )}
            </GlassCard>

            {/* Pending Actions (landlord) */}
            {isLandlord && (
              <>
                {(data?.pendingBookings?.length > 0) && (
                  <GlassCard className="p-5">
                    <SectionHeader title="Pending Booking Requests" subtitle="Approve or decline incoming requests" />
                    <div className="flex flex-col gap-2">
                      {data.pendingBookings.map(b => (
                        <PendingCard key={b._id} booking={b} onApprove={handleApprove} onReject={handleReject} />
                      ))}
                    </div>
                  </GlassCard>
                )}
                {data?.pendingLeases?.some(p => p.pendingTenants?.length) && (
                  <GlassCard className="p-5">
                    <SectionHeader title="Pending Tenant Requests" subtitle="Approve or decline join requests" />
                    <div className="flex flex-col gap-2">
                      {data.pendingLeases.map(property =>
                        property.pendingTenants?.map(tenant => (
                          <div key={`${property._id}-${tenant._id}`} className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/40">
                            <Avatar name={`${tenant.firstname} ${tenant.lastname}`} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{tenant.firstname} {tenant.lastname}</p>
                              <p className="text-xs text-slate-500 truncate">{property.propertyName}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleRejectLease(property._id, tenant._id)} className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors">Decline</button>
                              <button onClick={() => handleApproveLease(property._id, tenant._id)} className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg border-none cursor-pointer transition-colors">Accept</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>
                )}
                
                {/* My Tenants (landlord) */}
                {data?.landlordPropertiesWithTenants?.length > 0 && (
                  <GlassCard className="p-5">
                    <SectionHeader title="My Tenants" subtitle="Active tenants in your properties" />
                    <div className="flex flex-col gap-3">
                      {data.landlordPropertiesWithTenants.map(property =>
                        property.currentTenants?.map(tenant => (
                          <div key={`${property._id}-${tenant._id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                            <Avatar name={`${tenant.firstname} ${tenant.lastname}`} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{tenant.firstname} {tenant.lastname}</p>
                              <p className="text-xs text-slate-500 truncate">{tenant.email} • {tenant.phoneNumber || "No Phone"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{property.propertyName}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>
                )}
              </>
            )}

            {/* Current Rentals (tenant) */}
            {!isLandlord && data?.rentedProperties?.length > 0 && (
              <GlassCard className="p-5">
                <SectionHeader title="My Rentals" subtitle="Properties you currently rent" action={<Link to="/my-rentals" className="text-xs text-blue-600 font-semibold no-underline flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>} />
                <div className="flex flex-col divide-y divide-slate-50">
                  {data.rentedProperties.map(p => <PropertyRentalCard key={p._id} property={p} />)}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right column — 1/3 */}
          <div className="flex flex-col gap-6">

            {/* Recent Maintenance */}
            <GlassCard className="p-5">
              <SectionHeader
                title="Recent Requests"
                subtitle="Maintenance activity"
                action={<Link to="/maintenance" className="text-xs text-blue-600 font-semibold hover:text-blue-700 no-underline flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>}
              />
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3].map(i => <ListItemSkeleton key={i} />)}</div>
              ) : !data?.recentRequests?.length ? (
                <EmptyState
                  icon={<Wrench className="size-6" />}
                  title="No requests yet"
                  description="Submit a maintenance request when needed"
                  action={() => window.location.href = "/maintenance"}
                  actionLabel="Create Request"
                />
              ) : (
                <div className="flex flex-col">{data.recentRequests.map(r => <MaintenanceCard key={r._id} req={r} />)}</div>
              )}
            </GlassCard>

            {/* Current Booking Live */}
            {stats?.currentBooking && stats.currentBooking !== "None" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-5"
                style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Happening Now</span>
                </div>
                <p className="text-white text-lg font-bold">{stats.currentBooking}</p>
                <p className="text-blue-200 text-sm mt-1">You have an active booking</p>
              </motion.div>
            )}

            {/* Activity Feed */}
            <GlassCard className="p-5">
              <SectionHeader title="Recent Activity" />
              {loading ? (
                <div className="flex flex-col gap-3">{[1,2,3].map(i => <ListItemSkeleton key={i} />)}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[
                    { icon: TrendingUp, text: "Dashboard loaded", time: "Just now", color: "text-blue-500 bg-blue-50" },
                    ...(data?.recentRequests?.slice(0,2).map(r => ({
                      icon: Wrench,
                      text: `Maintenance: ${r.title}`,
                      time: new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
                      color: "text-amber-500 bg-amber-50"
                    })) || []),
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                        <a.icon className="size-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">{a.text}</p>
                        <p className="text-[10px] text-slate-400">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
