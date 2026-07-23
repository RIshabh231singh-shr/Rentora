import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Building2, Wrench, Calendar, ShieldCheck,
  TrendingUp, Clock, CheckCircle2, UserCheck, AlertTriangle,
  Search, ChevronDown, Trash2, Eye,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, EmptyState,
  Modal, SectionHeader, Badge, Skeleton, StatCard, Avatar,
} from "../components/ui";
import api from "../utility/axiosInstance";

const ROLE_COLORS = {
  tenant: "bg-blue-100 text-blue-700",
  landlord: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
  maintenance_staff: "bg-amber-100 text-amber-700",
};

function KPICard({ label, value, sub, color, icon: Icon, loading }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-rose-600",
    indigo: "from-indigo-500 to-indigo-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`size-10 rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} flex items-center justify-center`}>
          <Icon className="size-5 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-extrabold text-slate-900">{value ?? "—"}</p>
      )}
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function UserRow({ user, onRoleChange }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
      <Avatar name={`${user.firstname} ${user.lastname || ""}`} size="sm" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 truncate">{user.firstname} {user.lastname}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        {user.requestedRole && (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
            Requested: {user.requestedRole}
          </span>
        )}
      </div>
      
      <select 
        value={user.role} 
        onChange={(e) => onRoleChange(user._id, e.target.value)}
        className={`px-2 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer outline-none border-none ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}
      >
        <option value="tenant">Tenant</option>
        <option value="landlord">Landlord</option>
        <option value="admin">Admin</option>
        <option value="maintenance_staff">Staff</option>
      </select>

      <span className="text-[10px] text-slate-400 w-20 text-right">{new Date(user.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" })}</span>
    </div>
  );
}

function MaintenanceRow({ req }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <Wrench className="size-3.5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{req.title}</p>
        <p className="text-xs text-slate-400 truncate">{req.property?.propertyName} · {req.user?.firstname} {req.user?.lastname}</p>
      </div>
      <StatusBadge status={req.status} />
      <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
    </div>
  );
}

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // User Management State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Maintenance State
  const [properties, setProperties] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [tab, setTab] = useState("overview");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, maintRes, kpiRes, propRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/maintenance"),
        api.get("/maintenance/kpi"),
        api.get("/properties") // Admin can fetch all properties to filter
      ]);
      setMaintenance(maintRes.data.requests || maintRes.data || []);
      setKpi(kpiRes.data.data);
      setProperties(propRes.data.data || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async () => {
    setFetchingUsers(true);
    try {
      let url = `/users?page=${page}&limit=10`;
      if (search) url += `&search=${search}`;
      if (roleFilter !== "all") url += `&role=${roleFilter}`;
      
      const res = await api.get(url);
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalUsers(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("User fetch error:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (tab === "users") {
      fetchUsersData();
    }
  }, [page, search, roleFilter, tab]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchUsersData();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "User Management" },
    { key: "maintenance", label: "Maintenance" },
  ];

  return (
    <Layout pageTitle="Admin Panel">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <ShieldCheck className="size-4 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Admin Panel</h1>
            </div>
            <p className="text-slate-500 text-sm">Platform-wide monitoring and management</p>
          </div>
          <GradientButton onClick={() => { fetchDashboardData(); if (tab === 'users') fetchUsersData(); }} icon={<TrendingUp className="size-4" />} size="sm">
            Refresh
          </GradientButton>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 mb-8 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2 px-5 rounded-lg text-sm font-bold capitalize cursor-pointer border-none transition-all ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 bg-transparent"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard
                loading={loading}
                label="Total Requests"
                value={kpi?.total ?? 0}
                color="blue"
                icon={Wrench}
                sub="All maintenance"
              />
              <KPICard
                loading={loading}
                label="Completion Rate"
                value={kpi ? `${kpi.completionRate}%` : "—"}
                color={kpi?.completionRate >= 90 ? "green" : "amber"}
                icon={CheckCircle2}
                sub={`Target: ≥ 90% · ${kpi?.resolved ?? 0} resolved`}
              />
              <KPICard
                loading={loading}
                label="Avg Resolution"
                value={kpi?.avgResolutionHours != null ? `${kpi.avgResolutionHours}h` : "N/A"}
                color={kpi?.meetsSLA === true ? "green" : kpi?.meetsSLA === false ? "red" : "indigo"}
                icon={Clock}
                sub={`SLA target: ≤ 48h · ${kpi?.meetsSLA === true ? "✅ Within SLA" : kpi?.meetsSLA === false ? "⚠️ Exceeds SLA" : "No data yet"}`}
              />
              <KPICard
                loading={loading}
                label="Active Now"
                value={kpi?.inProgress ?? 0}
                color="amber"
                icon={AlertTriangle}
                sub={`${kpi?.pending ?? 0} pending`}
              />
            </div>

            {/* Recent Maintenance */}
            <GlassCard className="p-5">
              <SectionHeader
                title="Recent Maintenance Requests"
                subtitle="Platform-wide latest requests"
              />
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              ) : maintenance.length === 0 ? (
                <EmptyState icon={<Wrench className="size-6" />} title="No requests" description="No maintenance requests on the platform yet" />
              ) : (
                <div className="flex flex-col">
                  {maintenance.slice(0, 10).map(req => (
                    <MaintenanceRow key={req._id} req={req} />
                  ))}
                </div>
              )}
            </GlassCard>
          </>
        )}

        {tab === "users" && (
          <GlassCard className="p-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
              <SectionHeader
                title="User Management"
                subtitle={`Managing ${totalUsers} platform users`}
                noMargin
              />
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input w-60 py-1.5 text-sm"
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-input py-1.5 text-sm bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="maintenance_staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {fetchingUsers ? (
              <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : users.length === 0 ? (
              <EmptyState icon={<Users className="size-6" />} title="No users found" description="No users match your criteria" />
            ) : (
              <div className="flex flex-col">
                {users.map(user => (
                  <UserRow key={user._id} user={user} onRoleChange={handleRoleChange} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-50 border-none transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-50 border-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {tab === "maintenance" && (
          <GlassCard className="p-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
              <SectionHeader
                title="Maintenance Requests"
                subtitle={`${maintenance.length} total requests on platform`}
                noMargin
              />
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="form-input py-1.5 text-sm bg-white min-w-48 max-w-xs"
              >
                <option value="all">All Properties</option>
                {properties.map(p => (
                  <option key={p._id} value={p._id}>{p.propertyName}</option>
                ))}
              </select>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Pending", val: maintenance.filter(r => r.status === "pending").length, color: "bg-amber-100 text-amber-700" },
                { label: "In Progress", val: maintenance.filter(r => r.status === "in_progress" || r.status === "assigned").length, color: "bg-blue-100 text-blue-700" },
                { label: "Resolved", val: maintenance.filter(r => r.status === "resolved").length, color: "bg-emerald-100 text-emerald-700" },
                { label: "Cancelled", val: maintenance.filter(r => r.status === "cancelled").length, color: "bg-slate-100 text-slate-600" },
              ].map(s => (
                <div key={s.label} className={`p-3 rounded-xl text-center ${s.color}`}>
                  <p className="text-lg font-extrabold">{s.val}</p>
                  <p className="text-xs font-semibold">{s.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">{[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : maintenance.length === 0 ? (
              <EmptyState icon={<Wrench className="size-6" />} title="No requests" description="No maintenance requests found" />
            ) : (
              <div className="flex flex-col">
                {(() => {
                  const filteredMaintenance = propertyFilter === "all" ? maintenance : maintenance.filter(req => req.property?._id === propertyFilter || req.property === propertyFilter);
                  return filteredMaintenance.map(req => (
                    <MaintenanceRow key={req._id} req={req} />
                  ));
                })()}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </Layout>
  );
}
