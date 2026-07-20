import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Shield, Building2, Calendar, Wrench,
  Edit2, CheckCircle2, Camera, Star, TrendingUp, Clock, MapPin,
} from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, GradientButton, StatusBadge, Badge, Avatar, SectionHeader, Skeleton } from "../components/ui";
import api from "../utility/axiosInstance";

function ProfileField({ icon: Icon, label, value, verified }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="font-semibold text-slate-900 text-sm">{value || "—"}</p>
      </div>
      {verified !== undefined && (
        <Badge color={verified ? "green" : "amber"}>{verified ? "Verified" : "Pending"}</Badge>
      )}
    </div>
  );
}

function CompletionRing({ percentage }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative size-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-extrabold text-blue-600">{percentage}%</span>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstname: "", lastname: "", phoneNumber: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      const u = JSON.parse(s);
      setUser(u);
      setForm({ firstname: u.firstname || "", lastname: u.lastname || "", phoneNumber: u.phoneNumber || "" });
      api.get("/dashboard").then(r => { setDashData(r.data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  const completionFields = [
    user?.firstname, user?.lastname, user?.email, user?.phoneNumber, user?.isVerified
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const stats = dashData?.stats;

  return (
    <Layout pageTitle="Profile">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Profile Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 p-8"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0C1A3A 100%)" }}>
          <div className="blob w-48 h-48 bg-blue-500/20 top-0 right-0 animate-blob" />
          <div className="blob w-32 h-32 bg-indigo-500/15 bottom-0 left-20 animate-blob" style={{ animationDelay: "2s" }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="size-24 rounded-2xl overflow-hidden ring-4 ring-white/20">
                <Avatar name={`${user?.firstname} ${user?.lastname}`} size="xl" />
              </div>
              <button className="absolute -bottom-1 -right-1 size-8 rounded-xl bg-blue-600 flex items-center justify-center cursor-pointer border-none shadow-lg">
                <Camera className="size-3.5 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-white mb-1">{user?.firstname} {user?.lastname}</h1>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mb-3">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold capitalize">{user?.role}</span>
                {user?.isVerified && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>

            {/* Completion ring */}
            <div className="text-center">
              <CompletionRing percentage={completionPct} />
              <p className="text-slate-400 text-xs mt-2 font-medium">Profile complete</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Contact Details */}
            <GlassCard className="p-5">
              <SectionHeader
                title="Profile Details"
                action={
                  !editMode ? (
                    <GradientButton variant="outline" size="sm" onClick={() => setEditMode(true)} icon={<Edit2 className="size-3.5" />}>Edit</GradientButton>
                  ) : (
                    <div className="flex gap-2">
                      <GradientButton size="sm" loading={saving} onClick={async () => {
                        setSaving(true);
                        setMsg("");
                        try {
                          await api.patch("/auth/profile", form);
                          const updated = { ...user, ...form };
                          localStorage.setItem("user", JSON.stringify(updated));
                          setUser(updated);
                          setEditMode(false);
                          setMsg("Profile updated!");
                        } catch { setMsg("Failed to save."); }
                        finally { setSaving(false); }
                      }}>Save</GradientButton>
                      <GradientButton variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</GradientButton>
                    </div>
                  )
                }
              />
              {msg && <p className={`text-sm mb-4 font-medium ${msg.includes("updated") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>}
              {editMode ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First Name", key: "firstname" },
                    { label: "Last Name", key: "lastname" },
                    { label: "Phone Number", key: "phoneNumber" },
                  ].map(({ label, key }) => (
                    <div key={key} className={key === "phoneNumber" ? "col-span-2" : ""}>
                      <label className="form-label">{label}</label>
                      <input className="form-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <ProfileField icon={Mail} label="Email Address" value={user?.email} verified={user?.isVerified} />
                  <ProfileField icon={Phone} label="Phone Number" value={user?.phoneNumber} />
                  <ProfileField icon={Shield} label="Account Role" value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} />
                  <ProfileField icon={Calendar} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: "long", year: "numeric" }) : "N/A"} />
                </div>
              )}
            </GlassCard>

            {/* Recent Maintenance */}
            {dashData?.recentRequests?.length > 0 && (
              <GlassCard className="p-5">
                <SectionHeader title="Recent Maintenance" />
                <div className="flex flex-col gap-2">
                  {dashData.recentRequests.map(r => (
                    <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Wrench className="size-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{r.category} · {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right: Stats */}
          <div className="flex flex-col gap-5">
            {/* Stats cards */}
            {[
              { label: "Upcoming Bookings", value: stats?.upcomingBookings ?? 0, icon: Calendar, color: "from-blue-500 to-blue-600" },
              { label: "Active Requests", value: stats?.activeRequests ?? 0, icon: Wrench, color: "from-amber-500 to-amber-600" },
              { label: "Resolved", value: stats?.completedRequests ?? 0, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
              { label: "Amenity Bookings", value: stats?.amenityBookings ?? 0, icon: TrendingUp, color: "from-indigo-500 to-indigo-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  <Icon className="size-4 text-white/60" />
                </div>
                <p className="text-3xl font-extrabold">{loading ? "—" : value}</p>
              </div>
            ))}

            {/* Rented properties */}
            {dashData?.rentedProperties?.length > 0 && (
              <GlassCard className="p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Rentals</p>
                {dashData.rentedProperties.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50">
                    <div className="size-9 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.propertyName} /> : <Building2 className="size-4 text-slate-400 m-auto mt-2.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.propertyName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="size-3" />{p.city}</p>
                    </div>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
