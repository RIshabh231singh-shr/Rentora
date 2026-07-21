import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Plus, Clock, CheckCircle2, AlertCircle, Zap,
  Upload, Camera, X, ChevronDown, Filter, Calendar,
  Building2, User, ArrowRight, MessageSquare,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, EmptyState,
  Modal, SectionHeader, Badge, Avatar, Skeleton, StatCard,
} from "../components/ui";
import api from "../utility/axiosInstance";

const CATEGORIES = ["plumbing", "electrical", "cleaning", "carpentry", "pest control", "others"];
const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["pending", "assigned", "in_progress", "resolved"];

const STATUS_COLS = [
  { key: "pending",     label: "Pending",     color: "amber",  iconColor: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  { key: "in_progress", label: "In Progress", color: "blue",   iconColor: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200",  icon: Zap },
  { key: "resolved",    label: "Resolved",    color: "green",  iconColor: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
];

function RequestCard({ req, user, onView, onStatusChange }) {
  const isLandlord = user?.role === "landlord" || user?.role === "admin";
  const priorityColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView?.(req)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-bold text-slate-900 text-sm line-clamp-2 flex-1">{req.title}</p>
        {req.priority && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 capitalize ${priorityColors[req.priority] || priorityColors.low}`}>
            {req.priority}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 capitalize mb-3 flex items-center gap-1.5">
        <span className="inline-flex size-5 rounded-md bg-slate-100 items-center justify-center">
          <Wrench className="size-3 text-slate-500" />
        </span>
        {req.category}
      </p>
      {req.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{req.description}</p>
      )}
      {req.image && (
        <img src={req.image} alt="Request" className="w-full h-28 object-cover rounded-lg mb-3 border border-slate-100" />
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
        {isLandlord && req.status !== "resolved" && (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            {req.status === "pending" && (
              <button
                onClick={() => onStatusChange(req._id, "in_progress")}
                className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-lg border-none cursor-pointer hover:bg-blue-700"
              >
                Start
              </button>
            )}
            {req.status === "in_progress" && (
              <button
                onClick={() => onStatusChange(req._id, "resolved")}
                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-lg border-none cursor-pointer hover:bg-emerald-700"
              >
                Resolve ✓
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CreateRequestModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", category: "plumbing", propertyId: "", priority: "medium" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    if (user.role === "landlord" || user.role === "admin") {
      api.get("/properties").then(r => {
        const props = r.data.data || [];
        setProperties(props);
        if (props.length > 0) setForm(f => ({ ...f, propertyId: props[0]._id }));
      }).catch(() => {});
    } else {
      api.get("/dashboard").then(r => {
        const props = r.data.rentedProperties || [];
        setProperties(props);
        if (props.length > 0) setForm(f => ({ ...f, propertyId: props[0]._id }));
      }).catch(() => {});
    }
  }, [open, user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (image) fd.append("image", image);
      await api.post("/maintenance", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onCreated?.();
      onClose();
      setForm({ title: "", description: "", category: "plumbing", propertyId: "", priority: "medium" });
      setImage(null); setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Maintenance Request" width="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="form-label">Title *</label>
          <input className="form-input" required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Leaking pipe in kitchen" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Category *</label>
            <select className="form-input capitalize" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-input capitalize" value={form.priority} onChange={e => set("priority", e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        {properties.length > 0 && (
          <div>
            <label className="form-label">Property</label>
            <select className="form-input" value={form.propertyId} onChange={e => set("propertyId", e.target.value)}>
              {properties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input h-24 resize-none" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the issue in detail..." />
        </div>
        <div>
          <label className="form-label">Attach Photo (optional)</label>
          <label className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 cursor-pointer transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {preview ? (
              <img src={preview} className="h-20 w-20 object-cover rounded-lg" alt="preview" />
            ) : (
              <Camera className="size-6 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-700">{preview ? "Change photo" : "Upload photo"}</p>
              <p className="text-xs text-slate-400">JPG, PNG up to 10MB</p>
            </div>
          </label>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
        <div className="flex gap-3 pt-2">
          <GradientButton type="submit" loading={loading} icon={<CheckCircle2 className="size-4" />}>Submit Request</GradientButton>
          <GradientButton type="button" variant="ghost" onClick={onClose}>Cancel</GradientButton>
        </div>
      </form>
    </Modal>
  );
}

function RequestDetailModal({ req, open, onClose, user, onStatusChange }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");
  const isLandlord = user?.role === "landlord" || user?.role === "admin";

  useEffect(() => {
    if (!open || !isLandlord) return;
    // Fetch users that can be assigned as staff (maintenance_staff or tenant)
    api.get("/properties").then(r => {
      // We don't have a direct users endpoint, so we'll show a manual ID field
      // If you have a users list endpoint for admins, use that here
    }).catch(() => {});
  }, [open, isLandlord]);

  const handleAssign = async () => {
    if (!selectedStaff.trim()) return;
    setAssigning(true);
    setAssignMsg("");
    try {
      await api.put(`/maintenance/${req._id}/assign`, { staffId: selectedStaff.trim() });
      setAssignMsg("Staff assigned successfully!");
      setSelectedStaff("");
    } catch (err) {
      setAssignMsg(err.response?.data?.message || "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  if (!req) return null;

  return (
    <Modal open={open} onClose={onClose} title="Request Details" width="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{req.title}</h3>
            <p className="text-slate-500 text-sm capitalize">{req.category}</p>
          </div>
          <StatusBadge status={req.status} />
        </div>
        {req.image && (
          <img src={req.image} alt="Issue" className="w-full rounded-xl object-cover max-h-48 border border-slate-100" />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400 mb-0.5">Category</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{req.category}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400 mb-0.5">Priority</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{req.priority || "Normal"}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400 mb-0.5">Status</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{req.status?.replace("_", " ")}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400 mb-0.5">Created</p>
            <p className="text-sm font-semibold text-slate-900">{new Date(req.createdAt).toLocaleDateString()}</p>
          </div>
          {req.assignedStaff && (
            <div className="col-span-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-500 mb-0.5">Assigned Staff</p>
              <p className="text-sm font-semibold text-blue-900">
                {req.assignedStaff?.firstname
                  ? `${req.assignedStaff.firstname} ${req.assignedStaff.lastname || ""}`
                  : req.assignedStaff}
              </p>
            </div>
          )}
        </div>
        {req.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{req.description}</p>
          </div>
        )}
        {req.resolutionNotes && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 mb-0.5">Resolution Notes</p>
            <p className="text-sm text-emerald-800">{req.resolutionNotes}</p>
          </div>
        )}
        {isLandlord && req.status !== "resolved" && req.status !== "cancelled" && (
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
            {/* Status actions */}
            <div className="flex gap-2">
              {req.status === "pending" && (
                <GradientButton onClick={() => { onStatusChange(req._id, "in_progress"); onClose(); }} icon={<Zap className="size-4" />}>
                  Mark In Progress
                </GradientButton>
              )}
              {(req.status === "pending" || req.status === "in_progress" || req.status === "assigned") && (
                <GradientButton variant="success" onClick={() => { onStatusChange(req._id, "resolved"); onClose(); }} icon={<CheckCircle2 className="size-4" />}>
                  Mark Resolved
                </GradientButton>
              )}
            </div>
            {/* Staff assignment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Assign Staff Member</p>
              <div className="flex gap-2">
                <input
                  className="form-input flex-1 text-sm"
                  placeholder="Paste staff user ID here"
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                />
                <GradientButton size="sm" onClick={handleAssign} loading={assigning}>
                  Assign
                </GradientButton>
              </div>
              {assignMsg && (
                <p className={`text-xs mt-2 font-medium ${assignMsg.includes("success") ? "text-emerald-600" : "text-red-500"}`}>
                  {assignMsg}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Maintenance() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewReq, setViewReq] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/maintenance");
      setRequests(res.data.requests || res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchRequests(); }, [user]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      fetchRequests();
    } catch {}
  };

  const byStatus = (key) => requests.filter(r => r.status === key);

  const total = requests.length;
  const pending = byStatus("pending").length;
  const inProg = byStatus("in_progress").length;
  const resolved = byStatus("resolved").length;

  return (
    <Layout pageTitle="Maintenance">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Maintenance Requests</h1>
            <p className="text-slate-500 text-sm mt-1">Track and manage property maintenance</p>
          </div>
          <GradientButton onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
            New Request
          </GradientButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard loading={loading} label="Total" value={total} icon={<Wrench className="size-5" />} color="blue" />
          <StatCard loading={loading} label="Pending" value={pending} icon={<Clock className="size-5" />} color="amber" />
          <StatCard loading={loading} label="In Progress" value={inProg} icon={<Zap className="size-5" />} color="indigo" />
          <StatCard loading={loading} label="Resolved" value={resolved} icon={<CheckCircle2 className="size-5" />} color="green" />
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STATUS_COLS.map(col => {
            const colRequests = byStatus(col.key);
            return (
              <div key={col.key} className="flex flex-col">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.bg} border border-b-0 ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <col.icon className={`size-4 ${col.iconColor}`} />
                    <span className="font-bold text-slate-800 text-sm">{col.label}</span>
                  </div>
                  <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    col.key === "pending" ? "bg-amber-500" : col.key === "in_progress" ? "bg-blue-600" : "bg-emerald-500"
                  }`}>
                    {colRequests.length}
                  </span>
                </div>

                {/* Column body */}
                <div className={`flex-1 border border-t-0 ${col.border} rounded-b-2xl p-3 min-h-[400px] flex flex-col gap-2.5`}
                  style={{ background: col.key === "pending" ? "rgba(255, 251, 235, 0.4)" : col.key === "in_progress" ? "rgba(239, 246, 255, 0.4)" : "rgba(236, 253, 245, 0.4)" }}>
                  {loading ? (
                    [1,2,3].map(i => <Skeleton key={i} className="h-28" />)
                  ) : colRequests.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                      <col.icon className={`size-8 ${col.iconColor} opacity-30 mb-2`} />
                      <p className="text-xs text-slate-400 font-medium">No {col.label.toLowerCase()} requests</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {colRequests.map(req => (
                        <RequestCard
                          key={req._id}
                          req={req}
                          user={user}
                          onView={setViewReq}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-8 right-8 size-14 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer border-none z-50"
        style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)" }}
        title="New Request"
      >
        <Plus className="size-6 text-white" />
      </motion.button>

      <CreateRequestModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchRequests} />
      <RequestDetailModal req={viewReq} open={!!viewReq} onClose={() => setViewReq(null)} user={user} onStatusChange={handleStatusChange} />
    </Layout>
  );
}
