import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Clock, X, ChevronDown, Filter, Building2, Wrench, Users, ShieldCheck } from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, GradientButton, StatusBadge, EmptyState, SectionHeader, Badge, Skeleton } from "../components/ui";
import { dashboardService } from "../services/dashboardService";
import { bookingService } from "../services/bookingService";
import { propertyService } from "../services/propertyService";
import { userService } from "../services/userService";

const TYPE_ICONS = {
  BOOKING_CREATED: { icon: Building2, color: "bg-blue-100 text-blue-600", label: "Booking" },
  TENANT_REQUEST: { icon: Users, color: "bg-indigo-100 text-indigo-600", label: "Tenant" },
  MAINTENANCE: { icon: Wrench, color: "bg-amber-100 text-amber-600", label: "Maintenance" },
  ROLE_CHANGE_REQUEST: { icon: ShieldCheck, color: "bg-purple-100 text-purple-600", label: "Role Request" },
  default: { icon: Bell, color: "bg-slate-100 text-slate-600", label: "General" },
};

function NotifItem({ notif, onApproveBooking, onRejectBooking, onApproveLease, onRejectLease, onRoleAction, actioning, navigate }) {
  const { icon: Icon, color } = TYPE_ICONS[notif.type] || TYPE_ICONS.default;
  const bookingId = notif.relatedBooking?._id || notif.relatedBooking;
  const isPendingBooking = notif.relatedBooking?.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`p-5 rounded-2xl border transition-colors ${notif.status === "unread" ? "bg-blue-50/50 border-blue-100" : "bg-white border-slate-100 hover:bg-slate-50"}`}
    >
      <div className="flex items-start gap-4">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="size-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {notif.status === "unread" && (
                <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              )}
              <p className="font-bold text-slate-900 text-sm">{notif.title}</p>
              {notif.type && TYPE_ICONS[notif.type] && (
                <Badge color={
                  notif.type === "BOOKING_CREATED" ? "blue" :
                  notif.type === "TENANT_REQUEST" ? "indigo" :
                  notif.type === "ROLE_CHANGE_REQUEST" ? "purple" :
                  "amber"
                }>{TYPE_ICONS[notif.type]?.label}</Badge>
              )}
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">
              {new Date(notif.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{notif.message}</p>

          <div className="mt-3 flex gap-2 flex-wrap">
            {notif.type === "BOOKING_CREATED" && bookingId && isPendingBooking && (
              <>
                <button
                  onClick={() => onRejectBooking(bookingId, notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => onApproveBooking(bookingId, notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {actioning === notif._id ? "Processing..." : "Confirm"}
                </button>
              </>
            )}
            {notif.type === "BOOKING_CREATED" && bookingId && !isPendingBooking && (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">Already actioned</span>
            )}
            {notif.type === "TENANT_REQUEST" && notif.relatedProperty && notif.relatedUser && (
              <>
                <button
                  onClick={() => onRejectLease(notif.relatedProperty._id, notif.relatedUser._id, notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => onApproveLease(notif.relatedProperty._id, notif.relatedUser._id, notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {actioning === notif._id ? "Processing..." : "Approve"}
                </button>
              </>
            )}
            {notif.type === "ROLE_CHANGE_REQUEST" && notif.relatedUser && !notif.message.includes("approved") && !notif.message.includes("rejected") && (
              <>
                <button
                  onClick={() => onRoleAction(notif.relatedUser, "reject", notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => onRoleAction(notif.relatedUser, "approve", notif._id)}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {actioning === notif._id ? "Processing..." : "Approve"}
                </button>
              </>
            )}
            {notif.type === "CANCELLATION_REQUESTED" && bookingId && notif.relatedBooking?.status === "cancellation_requested" && (
              <>
                <button
                  onClick={() => onApproveBooking(bookingId, notif._id, "approve-cancellation")}
                  disabled={actioning === notif._id}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  {actioning === notif._id ? "Processing..." : "Approve Cancellation"}
                </button>
              </>
            )}
            {notif.type === "CANCELLATION_REQUESTED" && bookingId && notif.relatedBooking?.status !== "cancellation_requested" && (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">Already actioned</span>
            )}
            {notif.type === "ROLE_CHANGE_REQUEST" && (
              <button
                onClick={() => navigate("/admin")}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl border-none cursor-pointer transition-colors"
              >
                Review Request
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const FILTERS = ["all", "unread", "bookings", "tenants", "roles"];

export default function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardData();
      setNotifications(data.notifications || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchNotifications(); }, [user]);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
    try { await dashboardService.markNotificationsAsRead(); } catch {}
  };

  const handleApproveBooking = async (bookingId, notifId, action = "approve") => {
    setActioning(notifId);
    try {
      if (action === "approve-cancellation") {
        await bookingService.approveCancellation(bookingId);
      } else {
        await bookingService.approveBooking(bookingId);
      }
      await fetchNotifications();
    } catch {}
    finally { setActioning(null); }
  };

  const handleRejectBooking = async (bookingId, notifId) => {
    setActioning(notifId);
    try {
      await bookingService.rejectBooking(bookingId);
      await fetchNotifications();
    } catch {}
    finally { setActioning(null); }
  };

  const handleApproveLease = async (propertyId, tenantId, notifId) => {
    setActioning(notifId);
    try {
      await propertyService.acceptTenantRequest(propertyId, tenantId);
      await fetchNotifications();
    } catch {}
    finally { setActioning(null); }
  };

  const handleRejectLease = async (propertyId, tenantId, notifId) => {
    setActioning(notifId);
    try {
      await propertyService.rejectTenantRequest(propertyId, tenantId);
      await fetchNotifications();
    } catch {}
    finally { setActioning(null); }
  };

  const handleRoleAction = async (userId, action, notifId) => {
    setActioning(notifId);
    try {
      if (action === "approve") {
        await userService.approveRoleRequest(userId);
      } else {
        await userService.rejectRoleRequest(userId);
      }
      await fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} role`);
    } finally {
      setActioning(null);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "bookings") return n.type === "BOOKING_CREATED";
    if (filter === "tenants") return n.type === "TENANT_REQUEST";
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  return (
    <Layout pageTitle="Notifications">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">{unreadCount} new</span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Stay on top of updates and requests</p>
          </div>
          {unreadCount > 0 && (
            <GradientButton variant="outline" size="sm" onClick={handleMarkAllRead} icon={<CheckCircle2 className="size-4" />}>
              Mark all read
            </GradientButton>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer border transition-all whitespace-nowrap ${
                filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {f === "all" ? `All (${notifications.length})` :
               f === "unread" ? `Unread (${unreadCount})` :
               f === "bookings" ? `Bookings (${notifications.filter(n => n.type === "BOOKING_CREATED").length})` :
               `Tenants (${notifications.filter(n => n.type === "TENANT_REQUEST").length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-8" />}
            title={filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
            description={filter === "all" ? "New notifications will appear here" : "Nothing to show in this category"}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filtered.map(n => (
                <NotifItem
                  key={n._id}
                  notif={n}
                  onApproveBooking={handleApproveBooking}
                  onRejectBooking={handleRejectBooking}
                  onApproveLease={handleApproveLease}
                  onRejectLease={handleRejectLease}
                  onRoleAction={handleRoleAction}
                  actioning={actioning}
                  navigate={navigate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
